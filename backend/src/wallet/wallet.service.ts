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

  async deposit(userId: string, amount: number, paymentMethod: string): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const wallet = await this.findOneByUserId(userId);
    const previousBalance = wallet.balance;
    const newBalance = previousBalance + amount;

    // Update wallet balance
    wallet.balance = newBalance;
    wallet.ledgerBalance = newBalance;
    const savedWallet = await this.walletRepository.save(wallet);

    // Create wallet transaction log
    const ref = 'DEP' + Math.random().toString(36).substring(2, 12).toUpperCase();
    const walletTx = this.walletTransactionRepository.create({
      walletId: wallet.id,
      type: 'credit',
      amount,
      description: `Funded wallet via ${paymentMethod}`,
      reference: ref,
      previousBalance,
      newBalance,
    });
    await this.walletTransactionRepository.save(walletTx);

    // Create system-wide transaction log
    const systemTx = this.transactionRepository.create({
      userId,
      type: 'credit',
      service: 'deposit',
      amount,
      status: 'success',
      reference: ref,
      metadata: { paymentMethod },
    });
    await this.transactionRepository.save(systemTx);

    // Handle referral commission payout on first deposit
    try {
      const previousDeposits = await this.transactionRepository.count({
        where: { userId, service: 'deposit', status: 'success' },
      });

      // Since we just saved the current deposit transaction above, previousDeposits count will be 1
      if (previousDeposits === 1) {
        const user = await this.walletRepository.manager.findOne(User, {
          where: { id: userId },
        });

        if (user && user.referredBy) {
          const referrerWallet = await this.walletRepository.findOne({
            where: { userId: user.referredBy },
          });

          if (referrerWallet) {
            const referrerPrevBalance = referrerWallet.balance;
            referrerWallet.balance = referrerPrevBalance + 500;
            referrerWallet.ledgerBalance = referrerPrevBalance + 500;
            await this.walletRepository.save(referrerWallet);

            const refRef = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
            
            // Log for referrer's wallet ledger
            const refWalletTx = this.walletTransactionRepository.create({
              walletId: referrerWallet.id,
              type: 'credit',
              amount: 500,
              description: `Referral commission for inviting ${user.fullName}`,
              reference: refRef,
              previousBalance: referrerPrevBalance,
              newBalance: referrerPrevBalance + 500,
            });
            await this.walletTransactionRepository.save(refWalletTx);

            // Log for system transaction audits
            const refSystemTx = this.transactionRepository.create({
              userId: user.referredBy,
              type: 'credit',
              service: 'referral',
              amount: 500,
              status: 'success',
              reference: refRef,
              metadata: { referredUserId: userId },
            });
            await this.transactionRepository.save(refSystemTx);
          }
        }
      }
    } catch (referralErr) {
      console.error('Failed to process referral credit:', referralErr);
      // Fail silently to avoid breaking the deposit transaction itself
    }

    return savedWallet;
  }

  async debit(userId: string, amount: number, description: string): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const wallet = await this.findOneByUserId(userId);
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const previousBalance = wallet.balance;
    const newBalance = previousBalance - amount;

    // Update wallet balance
    wallet.balance = newBalance;
    wallet.ledgerBalance = newBalance;
    const savedWallet = await this.walletRepository.save(wallet);

    // Create wallet transaction log
    const ref = 'DEB' + Math.random().toString(36).substring(2, 12).toUpperCase();
    const walletTx = this.walletTransactionRepository.create({
      walletId: wallet.id,
      type: 'debit',
      amount,
      description,
      reference: ref,
      previousBalance,
      newBalance,
    });
    await this.walletTransactionRepository.save(walletTx);

    return savedWallet;
  }

  async credit(userId: string, amount: number, description: string): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const wallet = await this.findOneByUserId(userId);
    const previousBalance = wallet.balance;
    const newBalance = Number(previousBalance) + Number(amount);

    // Update wallet balance
    wallet.balance = newBalance;
    wallet.ledgerBalance = newBalance;
    const savedWallet = await this.walletRepository.save(wallet);

    // Create wallet transaction log
    const ref = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
    const walletTx = this.walletTransactionRepository.create({
      walletId: wallet.id,
      type: 'credit',
      amount,
      description,
      reference: ref,
      previousBalance,
      newBalance,
    });
    await this.walletTransactionRepository.save(walletTx);

    return savedWallet;
  }

  async getHistory(userId: string): Promise<WalletTransaction[]> {
    const wallet = await this.findOneByUserId(userId);
    return this.walletTransactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
    });
  }

  async getStats(userId: string) {
    const totalCount = await this.transactionRepository.count({
      where: { userId },
    });
    
    const successCount = await this.transactionRepository.count({
      where: { userId, status: 'success' },
    });

    // Referral commission can be derived from credits containing 'referral' in descriptions
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
