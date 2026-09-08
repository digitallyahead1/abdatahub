import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private walletService: WalletService,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['wallet'],
    });
  }

  async findOneByPhone(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { phoneNumber },
      relations: ['wallet'],
    });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['wallet'],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    // Generate unique referral code
    const referralCode = 'AB' + Math.random().toString(36).substring(2, 7).toUpperCase();
    
    const user = this.userRepository.create({
      ...userData,
      referralCode,
    });

    const savedUser = await this.userRepository.save(user);

    // Create wallet for user
    const wallet = this.walletRepository.create({
      userId: savedUser.id,
      balance: 0,
      ledgerBalance: 0,
    });
    await this.walletRepository.save(wallet);

    // If referred by someone, check referral
    if (userData.referredBy) {
      // Logic for tracking referral can be logged here
    }

    return savedUser;
  }

  async getReferrals(userId: string) {
    const user = await this.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');

    const referredUsers = await this.userRepository.find({
      where: { referredBy: userId },
      select: ['id', 'fullName', 'email', 'createdAt', 'status'],
    });

    // Earnings can be calculated based on referred user funding histories (simulated at ₦500 per funded user)
    // For simplicity, we can fetch from wallet transactions of type credit with referral description, or compute:
    const earnings = referredUsers.length * 500;

    return {
      referredUsers,
      earnings,
    };
  }

  async setTransactionPin(userId: string, pin: string): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.transactionPin = await bcrypt.hash(pin, 10);
    return this.userRepository.save(user);
  }

  async verifyTransactionPin(userId: string, pin: string): Promise<boolean> {
    if (!pin) {
      throw new BadRequestException('Transaction PIN is required.');
    }
    const user = await this.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.transactionPin) {
      throw new BadRequestException('Transaction PIN is not set. Please set it in your account settings.');
    }
    let isMatch: boolean;
    try {
      isMatch = await bcrypt.compare(pin, user.transactionPin);
    } catch (e) {
      // Only catch actual bcrypt errors (malformed hash etc.), not app exceptions
      throw new BadRequestException('Invalid transaction PIN format. Please reset your PIN.');
    }
    if (!isMatch) {
      throw new BadRequestException('Incorrect transaction PIN. Please try again.');
    }
    return true;
  }

  async applyAgent(userId: string): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.agentStatus === 'approved' || user.role === 'agent') {
      throw new BadRequestException('You are already an approved agent.');
    }
    if (user.agentStatus === 'pending') {
      throw new BadRequestException('You already have a pending agent application under review.');
    }

    const AGENT_FEE = 3000;
    const wallet = await this.walletService.findOneByUserId(userId);
    if (Number(wallet.balance) < AGENT_FEE) {
      throw new BadRequestException(
        `Insufficient wallet balance. An application fee of ₦${AGENT_FEE.toLocaleString()} is required to apply for Agent status. Your current balance is ₦${Number(wallet.balance).toLocaleString()}. Please fund your wallet and try again.`,
      );
    }

    // Debit the ₦3,000 fee atomically from wallet
    const ref = 'AGT' + Math.random().toString(36).substring(2, 12).toUpperCase();
    await this.walletService.debit(
      userId,
      AGENT_FEE,
      `Agent status upgrade application fee (₦${AGENT_FEE.toLocaleString()})`,
    );

    // Record system transaction log
    const systemTx = this.transactionRepository.create({
      userId,
      type: 'debit',
      service: 'agent-upgrade',
      amount: AGENT_FEE,
      status: 'success',
      reference: ref,
      metadata: {
        fee: AGENT_FEE,
        service: 'agent-upgrade',
        description: 'Agent status upgrade application fee',
      },
    });
    await this.transactionRepository.save(systemTx);

    user.agentStatus = 'pending';
    user.agentAppliedAt = new Date();
    return this.userRepository.save(user);
  }
}
