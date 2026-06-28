import { Injectable, OnModuleInit, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ExamCategory } from '../entities/exam-category.entity';
import { ExamPin } from '../entities/exam-pin.entity';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ExamsService implements OnModuleInit {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    @InjectRepository(ExamCategory)
    private categoryRepository: Repository<ExamCategory>,
    @InjectRepository(ExamPin)
    private pinRepository: Repository<ExamPin>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    private usersService: UsersService,
    private auditLogService: AuditLogService,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      const initialCategories = [
        { id: 'waec', name: 'WAEC Result Checker', price: 4000 },
        { id: 'neco', name: 'NECO Token Checker', price: 700 },
        { id: 'nabteb', name: 'NABTEB Checker Card', price: 900 },
      ];

      // Purge any obsolete exam categories (e.g. jamb, nbais)
      const allowedIds = initialCategories.map(c => c.id);
      await this.categoryRepository.createQueryBuilder()
        .delete()
        .where('id NOT IN (:...allowedIds)', { allowedIds })
        .execute();

      for (const cat of initialCategories) {
        const existing = await this.categoryRepository.findOne({ where: { id: cat.id } });
        if (!existing) {
          const entity = this.categoryRepository.create({
            id: cat.id,
            name: cat.name,
            price: cat.price,
            status: 'active',
          });
          await this.categoryRepository.save(entity);
        }
      }
      this.logger.log('Seeded initial exam categories successfully.');
    } catch (err) {
      this.logger.error('Failed to seed exam categories:', err);
    }
  }

  // Admin stats
  async getAdminStats() {
    const categories = await this.categoryRepository.find({ order: { id: 'ASC' } });
    const stats = [];

    for (const cat of categories) {
      const total = await this.pinRepository.count({ where: { examType: cat.id } });
      const sold = await this.pinRepository.count({ where: { examType: cat.id, isSold: true } });
      const available = await this.pinRepository.count({ where: { examType: cat.id, isSold: false, status: 'available' } });

      stats.push({
        id: cat.id,
        name: cat.name,
        price: cat.price,
        status: cat.status,
        total,
        sold,
        available,
      });
    }

    return stats;
  }

  // Get active user pricing & stock
  async getUserPricing() {
    const categories = await this.categoryRepository.find({ where: { status: 'active' }, order: { id: 'ASC' } });
    const list = [];
    for (const cat of categories) {
      const available = await this.pinRepository.count({ where: { examType: cat.id, isSold: false, status: 'available' } });
      list.push({
        id: cat.id,
        name: cat.name,
        price: cat.price,
        available,
      });
    }
    return list;
  }

  // Admin bulk upload
  async uploadPins(examType: string, pins: string[], serials: string[], adminUser: any) {
    const category = await this.categoryRepository.findOne({ where: { id: examType } });
    if (!category) {
      throw new NotFoundException('Exam category not found');
    }

    const uniquePins = Array.from(new Set(pins.map(p => p.trim()).filter(p => p !== '')));
    if (uniquePins.length === 0) {
      throw new BadRequestException('No valid PIN codes provided');
    }

    // Check for duplicates already in system
    const existing = await this.pinRepository.createQueryBuilder('pin')
      .where('pin.pinCode IN (:...uniquePins)', { uniquePins })
      .getMany();

    const existingCodes = new Set(existing.map(p => p.pinCode));
    const toInsert = [];

    for (let i = 0; i < uniquePins.length; i++) {
      const code = uniquePins[i];
      if (existingCodes.has(code)) continue;

      const serial = serials && serials[i] ? serials[i].trim() : null;
      toInsert.push(this.pinRepository.create({
        pinCode: code,
        serialNumber: serial || null,
        examType,
        isSold: false,
        status: 'available',
      }));
    }

    if (toInsert.length > 0) {
      await this.pinRepository.save(toInsert);
    }

    await this.auditLogService.log(adminUser.id, adminUser.email, 'exam_pins_upload', {
      examType,
      uploadedCount: uniquePins.length,
      savedCount: toInsert.length,
      duplicatesSkipped: uniquePins.length - toInsert.length,
    });

    return {
      uploaded: uniquePins.length,
      saved: toInsert.length,
      skipped: uniquePins.length - toInsert.length,
    };
  }

  // Admin update pricing
  async updatePricing(pricing: any, adminUser: any) {
    const oldPrices: Record<string, number> = {};
    const newPrices: Record<string, number> = {};

    for (const key of Object.keys(pricing)) {
      const category = await this.categoryRepository.findOne({ where: { id: key } });
      if (category) {
        oldPrices[key] = category.price;
        category.price = Number(pricing[key]);
        await this.categoryRepository.save(category);
        newPrices[key] = category.price;
      }
    }

    await this.auditLogService.log(adminUser.id, adminUser.email, 'exam_pricing_update', {
      oldPrices,
      newPrices,
    });

    return { success: true, newPrices };
  }

  // Admin list inventory
  async getInventory(page = 1, limit = 100, examType?: string, status?: string) {
    const query = this.pinRepository.createQueryBuilder('pin')
      .leftJoinAndSelect('pin.category', 'category')
      .leftJoinAndSelect('pin.soldToUser', 'user')
      .orderBy('pin.createdAt', 'DESC');

    if (examType) {
      query.andWhere('pin.examType = :examType', { examType });
    }
    if (status) {
      query.andWhere('pin.status = :status', { status });
    }

    const [pins, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      pins: pins.map(p => ({
        id: p.id,
        pinCode: p.pinCode,
        serialNumber: p.serialNumber,
        examType: p.examType,
        examName: p.category?.name || p.examType.toUpperCase(),
        isSold: p.isSold,
        soldToEmail: p.soldToUser?.email || null,
        soldToName: p.soldToUser?.fullName || null,
        soldAt: p.soldAt,
        amountPaid: p.amountPaid,
        status: p.status,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  // Toggle pin status
  async togglePin(id: string, status: string, adminUser: any) {
    const pin = await this.pinRepository.findOne({ where: { id } });
    if (!pin) throw new NotFoundException('PIN record not found');
    if (pin.isSold) throw new BadRequestException('Sold PINs cannot be toggled.');

    pin.status = status;
    await this.pinRepository.save(pin);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'exam_pin_status_toggle', {
      pinId: id,
      newStatus: status,
    });

    return pin;
  }

  // Delete PIN
  async deletePin(id: string, adminUser: any) {
    const pin = await this.pinRepository.findOne({ where: { id } });
    if (!pin) throw new NotFoundException('PIN record not found');
    if (pin.isSold) throw new BadRequestException('Sold PINs cannot be deleted.');

    await this.pinRepository.delete(id);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'exam_pin_delete', {
      pinId: id,
      pinCode: pin.pinCode,
    });

    return { success: true };
  }

  // User purchased PIN list
  async getUserPurchases(userId: string) {
    return this.pinRepository.find({
      where: { soldToUserId: userId, isSold: true },
      relations: ['category'],
      order: { soldAt: 'DESC' },
    });
  }

  // Transactional Pin Purchase Flow (With Pessimistic Row Locking)
  async purchasePins(userId: string, payload: any) {
    const { examType, quantity, amount, pin } = payload;
    const cleanType = examType.toLowerCase();

    // 1. Verify user's transaction pin
    await this.usersService.verifyTransactionPin(userId, pin);

    // 2. Query category details
    const category = await this.categoryRepository.findOne({ where: { id: cleanType } });
    if (!category) {
      throw new BadRequestException('Selected exam PIN category is invalid.');
    }
    if (category.status !== 'active') {
      throw new BadRequestException('Selected exam service is currently disabled.');
    }

    const price = Number(category.price);
    const totalAmount = price * Number(quantity);

    if (amount !== undefined && Math.abs(Number(amount) - totalAmount) > 0.01) {
      throw new BadRequestException('Amount mismatch detected. Please refresh pricing and retry.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Lock user's wallet
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet || wallet.balance < totalAmount) {
        throw new BadRequestException('Insufficient wallet balance to purchase result checkers.');
      }

      // 4. Retrieve and lock available pins
      const availablePins = await queryRunner.manager.createQueryBuilder(ExamPin, 'pin')
        .where('pin.examType = :cleanType AND pin.isSold = false AND pin.status = :status', { cleanType, status: 'available' })
        .setLock('pessimistic_write')
        .take(quantity)
        .getMany();

      if (availablePins.length < quantity) {
        throw new BadRequestException(`Insufficient result checker stock for ${cleanType.toUpperCase()}. Only ${availablePins.length} remaining.`);
      }

      // 5. Debit wallet
      const prevBalance = wallet.balance;
      wallet.balance = Number(prevBalance) - Number(totalAmount);
      wallet.ledgerBalance = Number(prevBalance) - Number(totalAmount);
      await queryRunner.manager.save(wallet);

      const ref = 'EXM' + Math.random().toString(36).substring(2, 12).toUpperCase();

      // 6. Log ledger debit transaction
      const walletTx = this.walletTransactionRepository.create({
        walletId: wallet.id,
        type: 'debit',
        amount: totalAmount,
        description: `Exam checker card purchase (${cleanType.toUpperCase()} x${quantity}) for user`,
        reference: ref,
        previousBalance: prevBalance,
        newBalance: wallet.balance,
      });
      await queryRunner.manager.save(walletTx);

      // 7. Map PINs as sold
      const soldDate = new Date();
      for (const ep of availablePins) {
        ep.isSold = true;
        ep.soldToUserId = userId;
        ep.soldAt = soldDate;
        ep.amountPaid = price;
        ep.status = 'sold';
        await queryRunner.manager.save(ep);
      }

      // 8. Log system-wide transaction
      const systemTx = queryRunner.manager.create(Transaction, {
        userId,
        type: 'debit',
        service: 'exam-pin',
        amount: totalAmount,
        status: 'success',
        reference: ref,
        metadata: {
          examType: cleanType,
          quantity,
          pins: availablePins.map(p => ({ pinCode: p.pinCode, serialNumber: p.serialNumber })),
        },
      });
      await queryRunner.manager.save(systemTx);

      // 9. Commit Transaction
      await queryRunner.commitTransaction();

      return {
        reference: ref,
        examType: cleanType,
        quantity,
        pins: availablePins.map(p => ({ pinCode: p.pinCode, serialNumber: p.serialNumber })),
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      const error = err as any;
      this.logger.error(`Pin purchase transaction rollback occurred: ${error.message}`, error.stack);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
