import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExamCategory } from '../entities/exam-category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { DataPlan } from '../entities/data-plan.entity';
import { AirtimePricing } from '../entities/airtime-pricing.entity';
import { SyncLog } from '../entities/sync-log.entity';
import { DataTransaction } from '../entities/data-transaction.entity';
import { AirtimeTransaction } from '../entities/airtime-transaction.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { SmePlugSyncService } from '../services/smeplug-sync.service';
import { SmePlugService } from '../services/smeplug.service';
import { WalletService } from '../wallet/wallet.service';
import { IacafeService } from '../services/iacafe.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(DataPlan)
    private dataPlanRepository: Repository<DataPlan>,
    @InjectRepository(AirtimePricing)
    private airtimePricingRepository: Repository<AirtimePricing>,
    @InjectRepository(SyncLog)
    private syncLogRepository: Repository<SyncLog>,
    @InjectRepository(DataTransaction)
    private dataTransactionRepository: Repository<DataTransaction>,
    @InjectRepository(AirtimeTransaction)
    private airtimeTransactionRepository: Repository<AirtimeTransaction>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @Inject(forwardRef(() => SmePlugSyncService))
    private smePlugSyncService: SmePlugSyncService,
    @Inject(forwardRef(() => SmePlugService))
    private smePlugService: SmePlugService,
    private auditLogService: AuditLogService,
    private walletService: WalletService,
    @Inject(forwardRef(() => IacafeService))
    private iacafeService: IacafeService,
    private authService: AuthService,
    private jwtService: JwtService,
    @InjectRepository(ExamCategory)
    private examCategoryRepository: Repository<ExamCategory>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.systemSettingRepository.count();
      if (count === 0) {
        const defaultSetting = this.systemSettingRepository.create({
          id: 1,
          mtnMargin: 10,
          airtelMargin: 15,
          gloMargin: 10,
          mobile9Margin: 10,
          utilityFee: 100,
          activeGateway: 'simulated',
          serviceFeeEnabled: true,
          serviceFeeMinAmount: 1000,
          serviceFeeMaxAmount: 20000,
          serviceFeeAmount: 30,
        });
        await this.systemSettingRepository.save(defaultSetting);
        this.logger.log('Default system settings seeded successfully.');
      }
    } catch (err) {
      this.logger.error('Failed to seed default system settings:', err);
    }
  }

  async getDashboardStats() {
    const totalUsersCount = await this.userRepository.count();
    
    // Deposits revenue
    const deposits = await this.transactionRepository.find({
      where: { service: 'deposit', status: 'success' },
    });
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);

    const successfulDataSales = await this.dataTransactionRepository.find({
      where: { status: 'success' },
    });
    const successfulAirtimeSales = await this.airtimeTransactionRepository.find({
      where: { status: 'success' },
    });

    const totalDataSales = successfulDataSales.reduce((sum, s) => sum + Number(s.sellingPrice), 0);
    const totalAirtimeSales = successfulAirtimeSales.reduce((sum, s) => sum + Number(s.sellingPrice), 0);
    
    // Fetch all successful system sales/debits (Cable, Electricity, Exam PINs)
    const successfulDebits = await this.transactionRepository.find({
      where: { type: 'debit', status: 'success' },
    });

    const totalCableSales = successfulDebits
      .filter((tx) => tx.service === 'cable')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalElectricitySales = successfulDebits
      .filter((tx) => tx.service === 'electricity')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalExamPinSales = successfulDebits
      .filter((tx) => tx.service === 'exam-pin')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Total sales revenue = sum of all services processed
    const totalRevenue = totalDataSales + totalAirtimeSales + totalCableSales + totalElectricitySales + totalExamPinSales;

    // Calculate dynamic profit margins
    const dataProfit = successfulDataSales.reduce((sum, s) => sum + Number(s.profit), 0);
    const airtimeProfit = successfulAirtimeSales.reduce((sum, s) => sum + Number(s.profit), 0);

    let extraProfit = 0;
    for (const tx of successfulDebits) {
      if (tx.service === 'electricity' || tx.service === 'cable') {
        const fee = Number(tx.metadata?.serviceFee) || 0;
        extraProfit += fee;
      } else if (tx.service === 'exam-pin') {
        // Assume 10% profit margin on exam pin sales
        extraProfit += Number(tx.amount) * 0.10;
      }
    }

    const totalProfit = dataProfit + airtimeProfit + extraProfit;

    // Get count of transactions created today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const dailyTransactionsCount = await this.transactionRepository.createQueryBuilder('tx')
      .where('tx.createdAt >= :startOfToday', { startOfToday })
      .getCount();

    return {
      totalRevenue,
      totalDeposits,
      totalDataSales,
      totalAirtimeSales,
      totalSales: totalDataSales + totalAirtimeSales + totalCableSales + totalElectricitySales + totalExamPinSales,
      totalProfit,
      totalUsersCount,
      dailyTransactionsCount,
    };
  }

  async getUsers() {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'fullName',
        'email',
        'phoneNumber',
        'role',
        'status',
        'emailVerified',
        'phoneVerified',
        'permissions',
        'createdAt',
      ],
    });
  }

  async updateUserStatus(userId: string, status: string, adminUser: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    // Prevent suspending the main super admin uthman4ecc@gmail.com
    if (user.email === 'uthman4ecc@gmail.com') {
      throw new BadRequestException('The primary Super Admin cannot be suspended.');
    }

    user.status = status;
    const savedUser = await this.userRepository.save(user);
    await this.auditLogService.log(adminUser.id, adminUser.email, 'user_status_update', {
      targetUserId: userId,
      targetEmail: user.email,
      status,
    });
    return savedUser;
  }

  async updateUserVerification(
    userId: string,
    field: 'emailVerified' | 'phoneVerified',
    value: boolean,
    adminUser: any,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user[field] = value;
    const savedUser = await this.userRepository.save(user);
    await this.auditLogService.log(adminUser.id, adminUser.email, 'user_verification_update', {
      targetUserId: userId,
      targetEmail: user.email,
      field,
      value,
    });
    return savedUser;
  }

  async sendRoleOtp(adminUser: any) {
    return this.authService.generateGenericOtp(adminUser.email);
  }

  async updateUserRoleAndPermissions(
    userId: string,
    role: string,
    permissions: string[],
    adminUser: any,
    otp?: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Prevent changing role or permissions of the main super admin uthman4ecc@gmail.com
    if (user.email === 'uthman4ecc@gmail.com' && adminUser.email !== 'uthman4ecc@gmail.com') {
      throw new BadRequestException('Only the primary Super Admin can modify their own credentials.');
    }

    // Require OTP if target role is administrative (admin or super_admin)
    if (role === 'admin' || role === 'super_admin') {
      if (!otp) {
        throw new BadRequestException('OTP verification is required to grant administrative roles.');
      }
      const isOtpValid = await this.authService.verifyGenericOtp(adminUser.email, otp);
      if (!isOtpValid) {
        throw new BadRequestException('Invalid or expired OTP code.');
      }
    }

    user.role = role;
    user.permissions = permissions;
    const savedUser = await this.userRepository.save(user);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'user_role_permissions_update', {
      targetUserId: userId,
      targetEmail: user.email,
      role,
      permissions,
    });

    return savedUser;
  }

  async getTransactions() {
    // Fetch all transactions with user relations
    const txs = await this.transactionRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return txs.map((t) => ({
      id: t.id,
      fullName: t.user?.fullName || 'System',
      email: t.user?.email || 'N/A',
      type: t.type,
      service: t.service,
      amount: t.amount,
      status: t.status,
      reference: t.reference,
      createdAt: t.createdAt,
      metadata: t.metadata,
    }));
  }

  async adjustWallet(payload: any, adminUser: any) {
    const { email, amount, operation, description } = payload;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User with this email not found');

    const wallet = await this.walletRepository.findOne({ where: { userId: user.id } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const previousBalance = wallet.balance;
    let newBalance = previousBalance;

    if (operation === 'credit') {
      newBalance = Number(previousBalance) + Number(amount);
    } else if (operation === 'debit' || operation === 'reverse') {
      if (previousBalance < amount && operation === 'debit') {
        throw new BadRequestException('User has insufficient wallet balance to debit');
      }
      newBalance = Number(previousBalance) - Number(amount);
    }

    // Update wallet balance
    wallet.balance = newBalance;
    wallet.ledgerBalance = newBalance;
    await this.walletRepository.save(wallet);

    // Log wallet transaction
    const ref = 'MAN' + Math.random().toString(36).substring(2, 12).toUpperCase();
    const walletTx = this.walletTransactionRepository.create({
      walletId: wallet.id,
      type: operation === 'credit' ? 'credit' : 'debit',
      amount,
      description: `Manual adjustment: ${description}`,
      reference: ref,
      previousBalance,
      newBalance,
    });
    await this.walletTransactionRepository.save(walletTx);

    // Log system-wide transaction
    const systemTx = this.transactionRepository.create({
      userId: user.id,
      type: operation === 'credit' ? 'credit' : 'debit',
      service: operation === 'reverse' ? 'reversal' : 'adjustment',
      amount,
      status: 'success',
      reference: ref,
      metadata: { description },
    });
    await this.transactionRepository.save(systemTx);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'wallet_adjust', {
      targetUserId: user.id,
      targetEmail: user.email,
      operation,
      amount,
      description,
      reference: ref,
    });

    return {
      success: true,
      message: `Successfully adjusted balance for ${user.fullName}`,
    };
  }

  async getSettings(): Promise<SystemSetting> {
    let settings = await this.systemSettingRepository.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.systemSettingRepository.create({
        id: 1,
        mtnMargin: 10,
        airtelMargin: 15,
        gloMargin: 10,
        mobile9Margin: 10,
        utilityFee: 100,
        activeGateway: 'simulated',
        serviceFeeEnabled: true,
        serviceFeeMinAmount: 1000,
        serviceFeeMaxAmount: 20000,
        serviceFeeAmount: 30,
      });
      await this.systemSettingRepository.save(settings);
    }
    return settings;
  }

  async updateSettings(settings: any, adminUser: any): Promise<SystemSetting> {
    const oldSettings = await this.getSettings();
    
    // Convert string numeric values to proper numbers
    const updatedFields: Partial<SystemSetting> = {};
    if (settings.mtnMargin !== undefined) updatedFields.mtnMargin = Number(settings.mtnMargin);
    if (settings.airtelMargin !== undefined) updatedFields.airtelMargin = Number(settings.airtelMargin);
    if (settings.gloMargin !== undefined) updatedFields.gloMargin = Number(settings.gloMargin);
    if (settings.mobile9Margin !== undefined) updatedFields.mobile9Margin = Number(settings.mobile9Margin);
    if (settings.utilityFee !== undefined) updatedFields.utilityFee = Number(settings.utilityFee);
    if (settings.activeGateway !== undefined) updatedFields.activeGateway = settings.activeGateway;
    if (settings.serviceFeeEnabled !== undefined) updatedFields.serviceFeeEnabled = Boolean(settings.serviceFeeEnabled);
    if (settings.serviceFeeMinAmount !== undefined) updatedFields.serviceFeeMinAmount = Number(settings.serviceFeeMinAmount);
    if (settings.serviceFeeMaxAmount !== undefined) updatedFields.serviceFeeMaxAmount = Number(settings.serviceFeeMaxAmount);
    if (settings.serviceFeeAmount !== undefined) updatedFields.serviceFeeAmount = Number(settings.serviceFeeAmount);
    if (settings.notificationEnabled !== undefined) updatedFields.notificationEnabled = Boolean(settings.notificationEnabled);
    if (settings.notificationMessage !== undefined) updatedFields.notificationMessage = settings.notificationMessage ?? null;

    const merged = this.systemSettingRepository.merge(oldSettings, updatedFields);
    const saved = await this.systemSettingRepository.save(merged);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'settings_update', {
      oldSettings,
      newSettings: saved,
    });

    return saved;
  }

  async getAuditLogs() {
    return this.auditLogService.findAll();
  }

  async getSyncLogs(): Promise<SyncLog[]> {
    return this.syncLogRepository.find({
      order: { syncTime: 'DESC' },
      take: 50,
    });
  }

  async triggerSync(adminUser: any): Promise<SyncLog> {
    this.logger.log(`Manual SMEPlug sync triggered by admin: ${adminUser.email}`);
    const log = await this.smePlugSyncService.runSync();
    
    await this.auditLogService.log(adminUser.id, adminUser.email, 'smeplug_manual_sync', {
      syncStatus: log.syncStatus,
      plansAdded: log.totalPlansAdded,
      plansUpdated: log.totalPlansUpdated,
      plansDisabled: log.totalPlansDisabled,
      errorMessage: log.errorMessage,
    });

    return log;
  }

  async getDataPlans(): Promise<DataPlan[]> {
    return this.dataPlanRepository.find({
      order: { network: 'ASC', sellingPrice: 'ASC' },
    });
  }

  async updateDataPlan(id: string, updateData: any, adminUser: any): Promise<DataPlan> {
    const plan = await this.dataPlanRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Data plan not found');

    const oldValues = {
      smeplugPlanId: plan.smeplugPlanId,
      provider: plan.provider,
      bundleName: plan.bundleName,
      sellingPrice: plan.sellingPrice,
      agentPrice: plan.agentPrice,
      overrideStatus: plan.overrideStatus,
      visibilityStatus: plan.visibilityStatus,
    };

    if (updateData.smeplugPlanId !== undefined && !isNaN(parseInt(updateData.smeplugPlanId, 10))) {
      plan.smeplugPlanId = parseInt(updateData.smeplugPlanId, 10);
    }
    if (updateData.provider !== undefined && updateData.provider.trim() !== '') {
      plan.provider = updateData.provider.trim();
    }
    if (updateData.bundleName !== undefined && updateData.bundleName.trim() !== '') plan.bundleName = updateData.bundleName.trim();
    if (updateData.sellingPrice !== undefined) plan.sellingPrice = parseFloat(updateData.sellingPrice);
    if (updateData.agentPrice !== undefined) plan.agentPrice = parseFloat(updateData.agentPrice);
    if (updateData.overrideStatus !== undefined) plan.overrideStatus = !!updateData.overrideStatus;
    if (updateData.visibilityStatus !== undefined) plan.visibilityStatus = !!updateData.visibilityStatus;

    const savedPlan = await this.dataPlanRepository.save(plan);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'data_plan_update', {
      planId: id,
      bundleName: plan.bundleName,
      oldValues,
      newValues: {
        bundleName: savedPlan.bundleName,
        sellingPrice: savedPlan.sellingPrice,
        agentPrice: savedPlan.agentPrice,
        overrideStatus: savedPlan.overrideStatus,
        visibilityStatus: savedPlan.visibilityStatus,
      },
    });

    return savedPlan;
  }

  async deleteDataPlan(id: string, adminUser: any) {
    const plan = await this.dataPlanRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Data plan not found');

    await this.dataPlanRepository.remove(plan);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'data_plan_deleted', {
      planId: id,
      bundleName: plan.bundleName,
      smeplugPlanId: plan.smeplugPlanId,
    });

    return { success: true, message: 'Data plan deleted successfully' };
  }

  async getAirtimePricing(): Promise<AirtimePricing[]> {
    return this.airtimePricingRepository.find({
      order: { network: 'ASC' },
    });
  }

  async updateAirtimePricing(network: string, updateData: any, adminUser: any): Promise<AirtimePricing> {
    const pricing = await this.airtimePricingRepository.findOne({ where: { network } });
    if (!pricing) throw new NotFoundException('Airtime pricing record not found');

    const oldValues = {
      sellingRate: pricing.sellingRate,
      agentRate: pricing.agentRate,
      overrideStatus: pricing.overrideStatus,
      visibilityStatus: pricing.visibilityStatus,
    };

    if (updateData.sellingRate !== undefined) pricing.sellingRate = parseFloat(updateData.sellingRate);
    if (updateData.agentRate !== undefined) pricing.agentRate = parseFloat(updateData.agentRate);
    if (updateData.overrideStatus !== undefined) pricing.overrideStatus = !!updateData.overrideStatus;
    if (updateData.visibilityStatus !== undefined) pricing.visibilityStatus = !!updateData.visibilityStatus;

    const savedPricing = await this.airtimePricingRepository.save(pricing);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'airtime_pricing_update', {
      network,
      oldValues,
      newValues: {
        sellingRate: savedPricing.sellingRate,
        agentRate: savedPricing.agentRate,
        overrideStatus: savedPricing.overrideStatus,
        visibilityStatus: savedPricing.visibilityStatus,
      },
    });

    return savedPricing;
  }

  async getReports(filters: any) {
    const { startDate, endDate, serviceType, network, status } = filters;

    let dataQuery = this.dataTransactionRepository.createQueryBuilder('tx')
      .leftJoinAndSelect('tx.user', 'user');
    
    let airtimeQuery = this.airtimeTransactionRepository.createQueryBuilder('tx')
      .leftJoinAndSelect('tx.user', 'user');

    if (startDate) {
      const parsedStart = new Date(startDate);
      dataQuery = dataQuery.andWhere('tx.createdAt >= :startDate', { startDate: parsedStart });
      airtimeQuery = airtimeQuery.andWhere('tx.createdAt >= :startDate', { startDate: parsedStart });
    }
    if (endDate) {
      const parsedEnd = new Date(endDate);
      dataQuery = dataQuery.andWhere('tx.createdAt <= :endDate', { endDate: parsedEnd });
      airtimeQuery = airtimeQuery.andWhere('tx.createdAt <= :endDate', { endDate: parsedEnd });
    }
    if (network) {
      dataQuery = dataQuery.andWhere('tx.network = :network', { network });
      airtimeQuery = airtimeQuery.andWhere('tx.network = :network', { network });
    }
    if (status) {
      dataQuery = dataQuery.andWhere('tx.status = :status', { status });
      airtimeQuery = airtimeQuery.andWhere('tx.status = :status', { status });
    }

    let dataTxs: DataTransaction[] = [];
    let airtimeTxs: AirtimeTransaction[] = [];

    if (!serviceType || serviceType === 'data') {
      dataTxs = await dataQuery.orderBy('tx.createdAt', 'DESC').getMany();
    }
    if (!serviceType || serviceType === 'airtime') {
      airtimeTxs = await airtimeQuery.orderBy('tx.createdAt', 'DESC').getMany();
    }

    let totalDataSales = 0;
    let totalDataProfit = 0;
    let dataCount = 0;
    const networkDataCounts: Record<string, number> = {};

    dataTxs.forEach((tx) => {
      if (tx.status === 'success') {
        totalDataSales += Number(tx.sellingPrice);
        totalDataProfit += Number(tx.profit);
      }
      dataCount++;
      networkDataCounts[tx.network] = (networkDataCounts[tx.network] || 0) + 1;
    });

    let totalAirtimeSales = 0;
    let totalAirtimeProfit = 0;
    let airtimeCount = 0;
    const networkAirtimeCounts: Record<string, number> = {};

    airtimeTxs.forEach((tx) => {
      if (tx.status === 'success') {
        totalAirtimeSales += Number(tx.sellingPrice);
        totalAirtimeProfit += Number(tx.profit);
      }
      airtimeCount++;
      networkAirtimeCounts[tx.network] = (networkAirtimeCounts[tx.network] || 0) + 1;
    });

    const totalSales = totalDataSales + totalAirtimeSales;
    const totalProfit = totalDataProfit + totalAirtimeProfit;
    const totalCount = dataCount + airtimeCount;

    return {
      summary: {
        totalDataSales,
        totalDataProfit,
        dataCount,
        totalAirtimeSales,
        totalAirtimeProfit,
        airtimeCount,
        totalSales,
        totalProfit,
        totalCount,
      },
      networkBreakdown: {
        data: networkDataCounts,
        airtime: networkAirtimeCounts,
      },
      dataTransactions: dataTxs,
      airtimeTransactions: airtimeTxs,
    };
  }

  async deleteUser(userId: string, adminUser: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.email === 'uthman4ecc@gmail.com') {
      throw new BadRequestException('The primary Super Admin cannot be deleted.');
    }

    await this.userRepository.remove(user);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'user_delete', {
      targetUserId: userId,
      targetEmail: user.email,
      targetFullName: user.fullName,
    });
    return { success: true };
  }

  async makeTransactionSuccessful(transactionId: string, adminUser: any) {
    const tx = await this.transactionRepository.findOne({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status === 'success') throw new BadRequestException('Transaction is already successful');

    const oldStatus = tx.status;
    tx.status = 'success';
    await this.transactionRepository.save(tx);

    if (tx.service === 'data') {
      const dataTx = await this.dataTransactionRepository.findOne({ where: { transactionReference: tx.reference } });
      if (dataTx) {
        dataTx.status = 'success';
        await this.dataTransactionRepository.save(dataTx);
      }
    } else if (tx.service === 'airtime') {
      const airtimeTx = await this.airtimeTransactionRepository.findOne({ where: { transactionReference: tx.reference } });
      if (airtimeTx) {
        airtimeTx.status = 'success';
        await this.airtimeTransactionRepository.save(airtimeTx);
      }
    }

    // If it is a deposit that was pending or failed, credit the wallet now
    if (tx.service === 'deposit' && oldStatus !== 'success') {
      await this.walletService.credit(tx.userId, tx.amount, `Manual admin credit for successful deposit ref ${tx.reference}`);
    }

    await this.auditLogService.log(adminUser.id, adminUser.email, 'transaction_status_success', {
      transactionId,
      reference: tx.reference,
      oldStatus,
    });

    return { success: true, message: 'Transaction status updated to success' };
  }

  async requeryTransaction(transactionId: string, adminUser: any) {
    const tx = await this.transactionRepository.findOne({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction not found');

    const settings = await this.getSettings();
    const isSimulated = settings.activeGateway === 'simulated';
    let providerStatus = tx.status; // Default to current status if no change
    let message = 'Transaction status remains unchanged.';
    let providerMeta: any = {};

    if (tx.service === 'electricity' || tx.service === 'cable') {
      const result = await this.iacafeService.requeryOrder(tx.reference);
      if (result && result.success) {
        const status = result.data?.status;
        if (status === 'completed-api' || result.message === 'ORDER COMPLETED') {
          providerStatus = 'success';
          message = 'Transaction completed successfully on IACAFE.';
          
          if (tx.service === 'electricity') {
            providerMeta = {
              token: result.data.token || result.data.electricity?.token || '',
              units: result.data.units || result.data.electricity?.units || '',
              band: result.data.band || result.data.electricity?.band || '',
              customerName: result.data.customer_name || result.data.electricity?.customer_name || '',
              customerAddress: result.data.customer_address || result.data.electricity?.customer_address || '',
              orderId: result.data.order_id,
              amountCharged: result.data.amount_charged,
              discount: result.data.discount,
            };
          } else if (tx.service === 'cable') {
            providerMeta = {
              customerName: result.data.customer_name || '',
              packageName: result.data.packageName || '',
              orderId: result.data.order_id,
              amountCharged: result.data.amount_charged,
              discount: result.data.discount,
            };
          }
        } else if (status === 'failed' || status === 'refunded') {
          providerStatus = 'failed';
          message = 'Transaction failed on IACAFE.';
        } else if (status === 'pending' || status === 'processing') {
          providerStatus = 'pending';
          message = 'Transaction is still pending on IACAFE.';
        }
      } else if (result && result.error && result.error.code === 'not_found') {
        providerStatus = 'failed';
        message = 'Order not found on IACAFE. Treating as failed.';
      } else {
        message = `Unable to verify status with IACAFE: ${result?.msg || 'Unknown error'}`;
      }
    } else if (isSimulated) {
      providerStatus = 'success';
      message = 'Transaction successfully verified on the simulated provider server.';
    } else if (tx.service === 'data' || tx.service === 'airtime') {
      // Query real provider API for data/airtime transaction status
      const txProvider = tx.metadata?.provider || 'smeplug';

      if (txProvider === 'amzaet') {
        // AMZAET does not have a standard requery endpoint — keep current status
        message = 'AMZAET transactions cannot be requeried automatically. Please verify manually on the AMZAET dashboard.';
      } else {
        // SMEPlug: query /transactions by customer_reference
        try {
          const smeplugResult = await this.smePlugService.getTransactionStatus(tx.reference);
          if (smeplugResult && smeplugResult.transaction) {
            const smeplugStatus = String(smeplugResult.transaction.status || '').toLowerCase();
            if (smeplugStatus === 'success' || smeplugStatus === 'successful' || smeplugStatus === 'completed') {
              providerStatus = 'success';
              message = 'Transaction confirmed successful on SMEPlug.';
              providerMeta.providerReference = smeplugResult.transaction.reference || '';
            } else if (smeplugStatus === 'failed' || smeplugStatus === 'refunded') {
              providerStatus = 'failed';
              message = 'Transaction confirmed failed on SMEPlug.';
            } else if (smeplugStatus === 'pending' || smeplugStatus === 'processing' || smeplugStatus === 'initiated') {
              providerStatus = 'pending';
              message = 'Transaction is still pending/processing on SMEPlug.';
            } else {
              message = `SMEPlug returned unrecognised status: ${smeplugStatus}. No changes made.`;
            }
          } else if (smeplugResult && smeplugResult.status === true && Array.isArray(smeplugResult.data)) {
            // Some SMEPlug responses return an array in data
            const match = smeplugResult.data.find((t: any) => t.customer_reference === tx.reference);
            if (match) {
              const matchStatus = String(match.status || match.current_status || '').toLowerCase();
              if (matchStatus === 'success' || matchStatus === 'successful' || matchStatus === 'completed') {
                providerStatus = 'success';
                message = 'Transaction confirmed successful on SMEPlug.';
                providerMeta.providerReference = match.reference || '';
              } else if (matchStatus === 'failed' || matchStatus === 'refunded') {
                providerStatus = 'failed';
                message = 'Transaction confirmed failed on SMEPlug.';
              } else {
                providerStatus = 'pending';
                message = `Transaction status on SMEPlug: ${matchStatus}.`;
              }
            } else {
              message = 'Transaction reference not found in SMEPlug response. No changes made.';
            }
          } else {
            message = 'Unable to verify transaction status with SMEPlug. No changes made.';
          }
        } catch (queryErr: any) {
          this.logger.error(`SMEPlug requery failed for ${tx.reference}: ${queryErr.message}`);
          message = `SMEPlug requery failed: ${queryErr.message}. No changes made.`;
        }
      }
    }

    if (tx.status !== providerStatus) {
      const oldStatus = tx.status;
      tx.status = providerStatus;
      tx.metadata = {
        ...(tx.metadata || {}),
        ...providerMeta,
      };

      // Handle transition to success
      if (providerStatus === 'success') {
        if (oldStatus === 'failed') {
          // If it was failed, it was refunded. We must re-debit the user.
          const wasRefunded = tx.metadata?.refunded === true || tx.metadata?.autoRefunded === true;
          if (wasRefunded) {
            await this.walletService.debit(
              tx.userId,
              tx.amount,
              `Wallet re-debit: successful ${tx.service} purchase (${tx.reference}) after initial failure refund`
            );
            tx.metadata.refunded = false;
            tx.metadata.reDebitedAt = new Date().toISOString();
          }
        }
      }

      // Handle transition to failed
      if (providerStatus === 'failed') {
        if (oldStatus === 'pending') {
          // Refund the user's wallet
          const refundRef = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
          await this.walletService.credit(
            tx.userId,
            tx.amount,
            `Refund for failed ${tx.service} purchase (${tx.reference})`
          );

          // Log refund transaction
          const refundTx = this.transactionRepository.create({
            userId: tx.userId,
            type: 'credit',
            service: 'reversal',
            amount: tx.amount,
            status: 'success',
            reference: refundRef,
            metadata: { originalReference: tx.reference, reason: `Requery resolved failed ${tx.service}` },
          });
          await this.transactionRepository.save(refundTx);

          tx.metadata.refunded = true;
          tx.metadata.autoRefunded = true;
          tx.metadata.refundedAt = new Date().toISOString();
          tx.metadata.refundReference = refundRef;
        }
      }

      await this.transactionRepository.save(tx);

      if (tx.service === 'data') {
        const dataTx = await this.dataTransactionRepository.findOne({ where: { transactionReference: tx.reference } });
        if (dataTx) {
          dataTx.status = providerStatus;
          await this.dataTransactionRepository.save(dataTx);
        }
      } else if (tx.service === 'airtime') {
        const airtimeTx = await this.airtimeTransactionRepository.findOne({ where: { transactionReference: tx.reference } });
        if (airtimeTx) {
          airtimeTx.status = providerStatus;
          await this.airtimeTransactionRepository.save(airtimeTx);
        }
      }

      if (tx.service === 'deposit' && oldStatus !== 'success' && providerStatus === 'success') {
        await this.walletService.credit(tx.userId, tx.amount, `Requery resolved successful deposit for ref ${tx.reference}`);
      }

      await this.auditLogService.log(adminUser.id, adminUser.email, 'transaction_requery_update', {
        transactionId,
        reference: tx.reference,
        oldStatus,
        newStatus: providerStatus,
      });

      return {
        success: true,
        status: providerStatus,
        message: `Status updated from ${oldStatus} to ${providerStatus} based on provider requery.`,
      };
    }

    return {
      success: true,
      status: tx.status,
      message: `${message} Current status remains: ${tx.status}`,
    };
  }

  async refundTransaction(transactionId: string, adminUser: any) {
    const tx = await this.transactionRepository.findOne({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction not found');

    if (tx.status !== 'failed') {
      throw new BadRequestException('Only failed transactions can be refunded.');
    }

    if (tx.metadata && tx.metadata.refunded) {
      throw new BadRequestException('This transaction has already been refunded.');
    }

    await this.walletService.credit(
      tx.userId,
      tx.amount,
      `Admin Refund for failed ${tx.service} purchase (${tx.reference})`,
    );

    tx.metadata = {
      ...(tx.metadata || {}),
      refunded: true,
      refundedAt: new Date().toISOString(),
      refundedBy: adminUser.email,
    };
    await this.transactionRepository.save(tx);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'transaction_refund', {
      transactionId,
      reference: tx.reference,
      userId: tx.userId,
      amount: tx.amount,
    });

    return {
      success: true,
      message: `Transaction ${tx.reference} successfully refunded to user wallet.`,
    };
  }

  // ============= AGENT MANAGEMENT =============

  async getAgentRequests() {
    return this.userRepository.find({
      where: [
        { agentStatus: 'pending' },
        { agentStatus: 'approved' },
        { agentStatus: 'rejected' },
      ],
      select: ['id', 'fullName', 'email', 'phoneNumber', 'role', 'agentStatus', 'agentAppliedAt', 'createdAt'],
      order: { agentAppliedAt: 'DESC' },
    });
  }

  async approveAgent(userId: string, adminUser: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.agentStatus !== 'pending') {
      throw new BadRequestException(`Cannot approve: user agent status is '${user.agentStatus}', expected 'pending'.`);
    }

    user.agentStatus = 'approved';
    user.role = 'agent';
    const saved = await this.userRepository.save(user);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'agent_approved', {
      targetUserId: userId,
      targetEmail: user.email,
    });

    return saved;
  }

  async rejectAgent(userId: string, adminUser: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.agentStatus !== 'pending') {
      throw new BadRequestException(`Cannot reject: user agent status is '${user.agentStatus}', expected 'pending'.`);
    }

    user.agentStatus = 'rejected';
    const saved = await this.userRepository.save(user);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'agent_rejected', {
      targetUserId: userId,
      targetEmail: user.email,
    });

    return saved;
  }

  // ============= IMPERSONATION =============

  async impersonateUser(targetUserId: string, adminUser: any) {
    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    await this.auditLogService.log(adminUser.id, adminUser.email, 'user_impersonated', {
      targetUserId,
      targetEmail: targetUser.email,
    });

    const payload = { email: targetUser.email, sub: targetUser.id, role: targetUser.role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '2h' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '2h' }),
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        role: targetUser.role,
        permissions: targetUser.permissions,
        agentStatus: targetUser.agentStatus,
        phoneNumber: targetUser.phoneNumber,
        username: targetUser.username,
        referralCode: targetUser.referralCode,
        emailVerified: targetUser.emailVerified,
        phoneVerified: targetUser.phoneVerified,
      },
    };
  }

  // ============= EXAM AGENT PRICING =============

  async getExamCategories() {
    return this.examCategoryRepository.find({ order: { id: 'ASC' } });
  }

  async updateExamAgentPricing(examType: string, agentPrice: number, adminUser: any) {
    const category = await this.examCategoryRepository.findOne({ where: { id: examType } });
    if (!category) throw new NotFoundException('Exam category not found');

    const oldPrice = category.agentPrice;
    category.agentPrice = agentPrice;
    const saved = await this.examCategoryRepository.save(category);

    await this.auditLogService.log(adminUser.id, adminUser.email, 'exam_agent_pricing_update', {
      examType,
      oldAgentPrice: oldPrice,
      newAgentPrice: agentPrice,
    });

    return saved;
  }
}
