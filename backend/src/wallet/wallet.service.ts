import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async findOneByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  /**
   * Atomically credit a user's wallet on deposit (bank transfer, etc).
   *
   * Uses a pessimistic row-level lock (SELECT FOR UPDATE) inside a DB
   * transaction so that the previousBalance snapshot is always accurate
   * in the audit log even under concurrent requests.
   */
  async deposit(
    userId: string,
    amount: number,
    paymentMethod: string,
    customReference?: string,
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const ref =
      customReference ||
      'DEP' + Math.random().toString(36).substring(2, 12).toUpperCase();

    // ─── Atomic credit inside a DB transaction with pessimistic row lock ───
    const savedWallet = await this.walletRepository.manager.transaction(
      async (em) => {
        // Lock the wallet row — any concurrent request must wait here
        const wallet = await em
          .getRepository(Wallet)
          .createQueryBuilder('wallet')
          .setLock('pessimistic_write')
          .where('wallet."userId" = :userId', { userId })
          .getOne();

        if (!wallet) throw new NotFoundException('Wallet not found');

        const previousBalance = Number(wallet.balance);
        const currentLedger = Number(wallet.ledgerBalance);
        const depositAmount = Number(amount);

        // ─── DEBT RECOVERY: auto-deduct hidden debt if ledgerBalance is negative ───
        // ledgerBalance < 0 means user has an outstanding debt from a previous incident.
        // We silently deduct it from this deposit and show it in their history.
        let netDepositAfterDebt = depositAmount;
        let debtDeducted = 0;
        let finalLedgerBalance = currentLedger + depositAmount;

        if (currentLedger < 0) {
          const outstandingDebt = Math.abs(currentLedger); // positive amount owed
          debtDeducted = Math.min(depositAmount, outstandingDebt); // can't deduct more than deposit
          netDepositAfterDebt = depositAmount - debtDeducted; // what actually goes to their balance
          const remainingDebt = outstandingDebt - debtDeducted;
          finalLedgerBalance = remainingDebt > 0 ? -remainingDebt : (previousBalance + netDepositAfterDebt);
        }

        const newBalance = previousBalance + netDepositAfterDebt;

        // Update wallet balances
        await em
          .createQueryBuilder()
          .update(Wallet)
          .set({
            balance: newBalance,
            ledgerBalance: finalLedgerBalance,
          })
          .where('id = :id', { id: wallet.id })
          .execute();

        // Credit entry (full deposit amount shown to user)
        await em.getRepository(WalletTransaction).save(
          em.getRepository(WalletTransaction).create({
            walletId: wallet.id,
            type: 'credit',
            amount: depositAmount,
            description: `Funded wallet via ${paymentMethod}`,
            reference: ref,
            previousBalance,
            newBalance: previousBalance + depositAmount,
          }),
        );

        // If debt was deducted, record a visible debit in history
        if (debtDeducted > 0) {
          const debtRef = 'DEBT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          const remainingDebt = Math.abs(currentLedger) - debtDeducted;
          const debtDescription = remainingDebt > 0
            ? `Debt recovery deduction (₦${remainingDebt.toLocaleString('en-NG')} still outstanding)`
            : `Debt recovery deduction (debt fully cleared)`;

          await em.getRepository(WalletTransaction).save(
            em.getRepository(WalletTransaction).create({
              walletId: wallet.id,
              type: 'debit',
              amount: debtDeducted,
              description: debtDescription,
              reference: debtRef,
              previousBalance: previousBalance + depositAmount,
              newBalance,
            }),
          );

          // Also log the debt deduction in the system transaction log
          await em.getRepository(Transaction).save(
            em.getRepository(Transaction).create({
              userId,
              type: 'debit',
              service: 'debt_recovery',
              amount: debtDeducted,
              status: 'success',
              reference: debtRef,
              metadata: { remainingDebt, totalDebt: Math.abs(currentLedger) },
            }),
          );
        }

        // System-wide transaction log for the deposit
        await em.getRepository(Transaction).save(
          em.getRepository(Transaction).create({
            userId,
            type: 'credit',
            service: 'deposit',
            amount: depositAmount,
            status: 'success',
            reference: ref,
            metadata: { paymentMethod },
          }),
        );

        wallet.balance = newBalance;
        wallet.ledgerBalance = finalLedgerBalance;
        return wallet;
      },
    );

    // ─── Referral commission on first deposit (outside the wallet lock) ───
    try {
      const previousDeposits = await this.transactionRepository.count({
        where: { userId, service: 'deposit', status: 'success' },
      });

      // Count is 1 only for the very first deposit (we just saved it above)
      if (previousDeposits === 1) {
        const user = await this.walletRepository.manager.findOne(User, {
          where: { id: userId },
        });

        if (user && user.referredBy) {
          // Use the race-safe credit() to pay the referrer
          await this.credit(
            user.referredBy,
            1,
            `Referral commission for inviting ${user.fullName}`,
          );

          // Log for system transaction audits
          const refRef =
            'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
          const refSystemTx = this.transactionRepository.create({
            userId: user.referredBy,
            type: 'credit',
            service: 'referral',
            amount: 1,
            status: 'success',
            reference: refRef,
            metadata: { referredUserId: userId },
          });
          await this.transactionRepository.save(refSystemTx);
        }
      }
    } catch (referralErr) {
      console.error('Failed to process referral credit:', referralErr);
      // Fail silently — do not roll back the deposit itself
    }

    return savedWallet;
  }

  /**
   * Atomically debit a user's wallet.
   *
   * Uses a pessimistic row-level lock (SELECT FOR UPDATE) inside a DB
   * transaction so that concurrent requests CANNOT both pass the balance
   * check before either write commits — this eliminates the double-spend
   * race condition that was previously present.
   *
   * Flow:
   *  1. BEGIN TRANSACTION
   *  2. SELECT ... FOR UPDATE  → acquires exclusive row lock
   *  3. Check balance >= amount (safe: no other tx can modify balance while locked)
   *  4. UPDATE balance atomically
   *  5. INSERT wallet_transaction log
   *  6. COMMIT → lock released, next queued request can proceed
   */
  async debit(
    userId: string,
    amount: number,
    description: string,
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const ref =
      'DEB' + Math.random().toString(36).substring(2, 12).toUpperCase();

    const savedWallet = await this.walletRepository.manager.transaction(
      async (em) => {
        // Lock this wallet row — any other concurrent debit/credit must queue here
        const wallet = await em
          .getRepository(Wallet)
          .createQueryBuilder('wallet')
          .setLock('pessimistic_write')
          .where('wallet."userId" = :userId', { userId })
          .getOne();

        if (!wallet) throw new NotFoundException('Wallet not found');

        const currentBalance = Number(wallet.balance);

        if (currentBalance < Number(amount)) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        const previousBalance = currentBalance;
        const newBalance = currentBalance - Number(amount);

        // Atomic decrement with a double-guard on balance at the DB level
        await em
          .createQueryBuilder()
          .update(Wallet)
          .set({
            balance: () => `balance - ${Number(amount)}`,
            ledgerBalance: () => `"ledgerBalance" - ${Number(amount)}`,
          })
          .where('id = :id AND balance >= :amount', {
            id: wallet.id,
            amount: Number(amount),
          })
          .execute();

        // Wallet ledger entry
        await em.getRepository(WalletTransaction).save(
          em.getRepository(WalletTransaction).create({
            walletId: wallet.id,
            type: 'debit',
            amount,
            description,
            reference: ref,
            previousBalance,
            newBalance,
          }),
        );

        wallet.balance = newBalance;
        wallet.ledgerBalance = newBalance;
        return wallet;
      },
    );

    return savedWallet;
  }

  /**
   * Atomically credit a user's wallet (used for refunds, reversals, referrals).
   *
   * Uses a pessimistic row-level lock inside a DB transaction to guarantee
   * that previousBalance snapshots are always accurate in the audit log,
   * even when multiple refunds fire at the same time.
   */
  async credit(
    userId: string,
    amount: number,
    description: string,
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const ref =
      'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();

    const savedWallet = await this.walletRepository.manager.transaction(
      async (em) => {
        // Lock the row so concurrent operations cannot produce stale balance snapshots
        const wallet = await em
          .getRepository(Wallet)
          .createQueryBuilder('wallet')
          .setLock('pessimistic_write')
          .where('wallet."userId" = :userId', { userId })
          .getOne();

        if (!wallet) throw new NotFoundException('Wallet not found');

        const previousBalance = Number(wallet.balance);
        const newBalance = previousBalance + Number(amount);

        await em
          .createQueryBuilder()
          .update(Wallet)
          .set({
            balance: () => `balance + ${Number(amount)}`,
            ledgerBalance: () => `"ledgerBalance" + ${Number(amount)}`,
          })
          .where('id = :id', { id: wallet.id })
          .execute();

        // Wallet ledger entry
        await em.getRepository(WalletTransaction).save(
          em.getRepository(WalletTransaction).create({
            walletId: wallet.id,
            type: 'credit',
            amount,
            description,
            reference: ref,
            previousBalance,
            newBalance,
          }),
        );

        wallet.balance = newBalance;
        wallet.ledgerBalance = newBalance;
        return wallet;
      },
    );

    return savedWallet;
  }

  async getHistory(userId: string, limit = 100): Promise<any[]> {
    const wallet = await this.findOneByUserId(userId);
    const txs = await this.walletTransactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return txs.map((tx) => {
      const desc = tx.description || '';
      const phoneMatch = desc.match(/(?:\+?234|0)[789][01]\d{8}/);
      const networkMatch = desc.match(/\b(MTN|AIRTEL|GLO|9MOBILE|ETISALAT)\b/i);

      let detectedService = 'general';
      const descLower = desc.toLowerCase();
      if (descLower.includes('data')) detectedService = 'data';
      else if (descLower.includes('airtime')) detectedService = 'airtime';
      else if (descLower.includes('electricity') || descLower.includes('meter')) detectedService = 'electricity';
      else if (descLower.includes('cable') || descLower.includes('dstv') || descLower.includes('gotv') || descLower.includes('startimes')) detectedService = 'cable';
      else if (descLower.includes('exam') || descLower.includes('pin')) detectedService = 'exam-pin';
      else if (descLower.includes('fund') || descLower.includes('deposit')) detectedService = 'deposit';
      else if (descLower.includes('reversal') || descLower.includes('refund')) detectedService = 'reversal';

      return {
        ...tx,
        status: 'success',
        service: detectedService,
        metadata: {
          phoneNumber: phoneMatch ? phoneMatch[0] : undefined,
          network: networkMatch ? networkMatch[1].toUpperCase() : undefined,
        },
      };
    });
  }

  async getStats(userId: string) {
    const totalCount = await this.transactionRepository.count({
      where: { userId },
    });

    const successCount = await this.transactionRepository.count({
      where: { userId, status: 'success' },
    });

    // Referral commission derived directly from SQL aggregate
    const wallet = await this.findOneByUserId(userId);
    const referralRow = await this.walletTransactionRepository
      .createQueryBuilder('wt')
      .select('COALESCE(SUM(wt.amount), 0)', 'total')
      .where('wt.walletId = :walletId', { walletId: wallet.id })
      .andWhere('wt.type = :type', { type: 'credit' })
      .andWhere('LOWER(wt.description) LIKE :term', { term: '%referral%' })
      .getRawOne();

    const referralEarnings = Number(referralRow?.total || 0);

    return {
      totalCount,
      successCount,
      referralEarnings,
    };
  }
}
