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
        const newBalance = previousBalance + Number(amount);

        // Atomic increment — cannot produce a stale read while lock is held
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
            description: `Funded wallet via ${paymentMethod}`,
            reference: ref,
            previousBalance,
            newBalance,
          }),
        );

        // System-wide transaction log
        await em.getRepository(Transaction).save(
          em.getRepository(Transaction).create({
            userId,
            type: 'credit',
            service: 'deposit',
            amount,
            status: 'success',
            reference: ref,
            metadata: { paymentMethod },
          }),
        );

        wallet.balance = newBalance;
        wallet.ledgerBalance = newBalance;
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

  async getHistory(userId: string): Promise<any[]> {
    const wallet = await this.findOneByUserId(userId);
    const txs = await this.walletTransactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
    });
    return txs.map((tx) => ({
      ...tx,
      status: 'success',
    }));
  }

  async getStats(userId: string) {
    const totalCount = await this.transactionRepository.count({
      where: { userId },
    });

    const successCount = await this.transactionRepository.count({
      where: { userId, status: 'success' },
    });

    // Referral commission derived from credits with 'referral' in description
    const wallet = await this.findOneByUserId(userId);
    const referralTx = await this.walletTransactionRepository.find({
      where: {
        walletId: wallet.id,
        type: 'credit',
      },
    });

    const referralEarnings = referralTx
      .filter((t) => t.description?.toLowerCase().includes('referral'))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalCount,
      successCount,
      referralEarnings,
    };
  }
}
