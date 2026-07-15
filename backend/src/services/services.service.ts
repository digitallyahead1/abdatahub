import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { DataPlan } from '../entities/data-plan.entity';
import { AirtimePricing } from '../entities/airtime-pricing.entity';
import { DataTransaction } from '../entities/data-transaction.entity';
import { AirtimeTransaction } from '../entities/airtime-transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import { SmePlugService } from './smeplug.service';
import { IacafeService } from './iacafe.service';
import { AdminService } from '../admin/admin.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private walletService: WalletService,
    private smePlugService: SmePlugService,
    private iacafeService: IacafeService,
    @Inject(forwardRef(() => AdminService))
    private adminService: AdminService,
    private usersService: UsersService,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(DataPlan)
    private dataPlanRepository: Repository<DataPlan>,
    @InjectRepository(AirtimePricing)
    private airtimePricingRepository: Repository<AirtimePricing>,
    @InjectRepository(DataTransaction)
    private dataTransactionRepository: Repository<DataTransaction>,
    @InjectRepository(AirtimeTransaction)
    private airtimeTransactionRepository: Repository<AirtimeTransaction>,
  ) {}

  async getDataPlans() {
    return this.dataPlanRepository.find({
      where: { visibilityStatus: true },
      order: { network: 'ASC', sellingPrice: 'ASC' },
    });
  }

  async getSettingsForUsers() {
    return this.adminService.getSettings();
  }

  async getAirtimePricing() {
    return this.airtimePricingRepository.find({
      where: { visibilityStatus: true },
    });
  }

  async purchaseData(userId: string, payload: any) {
    const { phoneNumber, network, planId, pin } = payload;
    await this.usersService.verifyTransactionPin(userId, pin);
    
    const planIdNum = parseInt(planId, 10);
    const plan = await this.dataPlanRepository.findOne({
      where: !isNaN(planIdNum)
        ? [{ id: planId }, { smeplugPlanId: planIdNum }]
        : { id: planId },
    });

    if (!plan || !plan.visibilityStatus) {
      throw new BadRequestException('The selected data plan is currently unavailable.');
    }

    const amount = plan.sellingPrice;
    const planName = plan.bundleName;

    // 2. Debit user's wallet
    await this.walletService.debit(
      userId,
      amount,
      `Data subscription purchase (${plan.network.toUpperCase()} - ${planName}) for ${phoneNumber}`,
    );

    // 3. Create records with pending status
    const ref = 'DAT' + Math.random().toString(36).substring(2, 12).toUpperCase();
    const profit = Number(amount) - Number(plan.smeplugCost);

    const dataTx = this.dataTransactionRepository.create({
      userId,
      network: plan.network,
      planId: plan.smeplugPlanId.toString(),
      bundleName: planName,
      smeplugCost: plan.smeplugCost,
      sellingPrice: amount,
      profit,
      transactionReference: ref,
      status: 'pending',
    });
    await this.dataTransactionRepository.save(dataTx);

    const systemTx = this.transactionRepository.create({
      userId,
      type: 'debit',
      service: 'data',
      amount,
      status: 'pending',
      reference: ref,
      metadata: { phoneNumber, network: plan.network, planName, profit },
    });
    await this.transactionRepository.save(systemTx);

    // 4. Map network to SMEPlug ID
    const networkMap: Record<string, number> = {
      mtn: 1,
      airtel: 2,
      '9mobile': 3,
      glo: 4,
    };
    const networkId = networkMap[plan.network.toLowerCase()];

    // 5. Call SMEPlug API
    const result = await this.smePlugService.purchaseData(
      networkId,
      plan.smeplugPlanId,
      phoneNumber,
      ref,
    );

    // 6. Handle success or rollback on failure
    if (result && (result.status === true || result.current_status === 'success' || result.current_status === 'processing')) {
      const finalStatus = result.current_status === 'failed' ? 'failed' : 'success';
      
      dataTx.status = finalStatus;
      await this.dataTransactionRepository.save(dataTx);

      systemTx.status = finalStatus;
      await this.transactionRepository.save(systemTx);

      if (finalStatus === 'failed') {
        // Rollback wallet debit on failure
        await this.walletService.credit(userId, amount, `Refund for failed Data purchase (${ref})`);
        
        // Log system-wide refund transaction
        const refundRef = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
        const refundTx = this.transactionRepository.create({
          userId,
          type: 'credit',
          service: 'reversal',
          amount,
          status: 'success',
          reference: refundRef,
          metadata: { originalReference: ref, reason: 'Failed data purchase refund' },
        });
        await this.transactionRepository.save(refundTx);

        // Update original transaction metadata
        systemTx.metadata = {
          ...(systemTx.metadata || {}),
          refunded: true,
          autoRefunded: true,
          refundedAt: new Date().toISOString(),
          refundReference: refundRef,
        };
        await this.transactionRepository.save(systemTx);

        throw new BadRequestException(result?.data?.msg || result?.msg || 'Data purchase transaction failed on provider gateway');
      }

      return {
        reference: ref,
        providerReference: result.data?.reference || '',
        network: plan.network,
        planName,
        phoneNumber,
        status: finalStatus,
      };
    } else if (result && result.isTransientError) {
      // Transient error (timeout / gateway error) - do NOT refund, keep status pending
      dataTx.status = 'pending';
      await this.dataTransactionRepository.save(dataTx);

      systemTx.status = 'pending';
      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        error: result.msg || 'Gateway timeout or server error. Processing status is pending.',
      };
      await this.transactionRepository.save(systemTx);

      throw new BadRequestException('Your transaction is currently processing on the network. Please check your transaction history shortly to verify status.');
    } else {
      // Hard failure - rollback wallet debit
      dataTx.status = 'failed';
      await this.dataTransactionRepository.save(dataTx);

      systemTx.status = 'failed';

      // Log system-wide refund transaction
      const refundRef = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const refundTx = this.transactionRepository.create({
        userId,
        type: 'credit',
        service: 'reversal',
        amount,
        status: 'success',
        reference: refundRef,
        metadata: { originalReference: ref, reason: 'Failed data purchase refund' },
      });
      await this.transactionRepository.save(refundTx);

      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        refunded: true,
        autoRefunded: true,
        refundedAt: new Date().toISOString(),
        refundReference: refundRef,
      };
      await this.transactionRepository.save(systemTx);

      await this.walletService.credit(userId, amount, `Refund for failed Data purchase (${ref})`);
      throw new BadRequestException(result?.data?.msg || result?.msg || 'Unable to complete data purchase with the provider.');
    }
  }

  async purchaseAirtime(userId: string, payload: any) {
    const { phoneNumber, network, amount, pin } = payload;
    await this.usersService.verifyTransactionPin(userId, pin);
    const cleanNetwork = network.toLowerCase();

    // 1. Look up airtime pricing rate
    const pricing = await this.airtimePricingRepository.findOne({
      where: { network: cleanNetwork, visibilityStatus: true },
    });

    if (!pricing) {
      throw new BadRequestException('Airtime service is currently disabled for this network.');
    }

    const sellingPrice = Number(amount) * Number(pricing.sellingRate);
    const smeplugCost = Number(amount) * Number(pricing.smeplugRate);
    const profit = sellingPrice - smeplugCost;

    // 2. Debit user's wallet
    await this.walletService.debit(
      userId,
      sellingPrice,
      `Airtime recharge purchase (${cleanNetwork.toUpperCase()}) for ${phoneNumber}`,
    );

    // 3. Create records with pending status
    const ref = 'AIR' + Math.random().toString(36).substring(2, 12).toUpperCase();

    const airtimeTx = this.airtimeTransactionRepository.create({
      userId,
      network: cleanNetwork,
      amount,
      smeplugCost,
      sellingPrice,
      profit,
      transactionReference: ref,
      status: 'pending',
    });
    await this.airtimeTransactionRepository.save(airtimeTx);

    const systemTx = this.transactionRepository.create({
      userId,
      type: 'debit',
      service: 'airtime',
      amount: sellingPrice,
      status: 'pending',
      reference: ref,
      metadata: { phoneNumber, network: cleanNetwork, faceValue: amount, profit },
    });
    await this.transactionRepository.save(systemTx);

    // 4. Map network to SMEPlug ID
    const networkMap: Record<string, number> = {
      mtn: 1,
      airtel: 2,
      '9mobile': 3,
      glo: 4,
    };
    const networkId = networkMap[cleanNetwork];

    // 5. Call SMEPlug API
    const result = await this.smePlugService.purchaseAirtime(
      networkId,
      phoneNumber,
      amount,
      ref,
    );

    // 6. Handle success or rollback on failure
    if (result && (result.status === true || result.current_status === 'success' || result.current_status === 'processing')) {
      const finalStatus = result.current_status === 'failed' ? 'failed' : 'success';

      airtimeTx.status = finalStatus;
      await this.airtimeTransactionRepository.save(airtimeTx);

      systemTx.status = finalStatus;
      await this.transactionRepository.save(systemTx);

      if (finalStatus === 'failed') {
        await this.walletService.credit(userId, sellingPrice, `Refund for failed Airtime recharge (${ref})`);
        
        // Log system-wide refund transaction
        const refundRef = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
        const refundTx = this.transactionRepository.create({
          userId,
          type: 'credit',
          service: 'reversal',
          amount: sellingPrice,
          status: 'success',
          reference: refundRef,
          metadata: { originalReference: ref, reason: 'Failed airtime purchase refund' },
        });
        await this.transactionRepository.save(refundTx);

        systemTx.metadata = {
          ...(systemTx.metadata || {}),
          refunded: true,
          autoRefunded: true,
          refundedAt: new Date().toISOString(),
          refundReference: refundRef,
        };
        await this.transactionRepository.save(systemTx);

        throw new BadRequestException(result?.data?.msg || result?.msg || 'Airtime purchase failed on provider gateway');
      }

      return {
        reference: ref,
        providerReference: result.data?.reference || '',
        network: cleanNetwork,
        phoneNumber,
        amount,
        chargedAmount: sellingPrice,
        status: finalStatus,
      };
    } else if (result && result.isTransientError) {
      // Transient error (timeout / gateway error) - do NOT refund, keep status pending
      airtimeTx.status = 'pending';
      await this.airtimeTransactionRepository.save(airtimeTx);

      systemTx.status = 'pending';
      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        error: result.msg || 'Gateway timeout or server error. Processing status is pending.',
      };
      await this.transactionRepository.save(systemTx);

      throw new BadRequestException('Your transaction is currently processing on the network. Please check your transaction history shortly to verify status.');
    } else {
      // Hard failure - rollback wallet debit
      airtimeTx.status = 'failed';
      await this.airtimeTransactionRepository.save(airtimeTx);

      systemTx.status = 'failed';

      // Log system-wide refund transaction
      const refundRef = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const refundTx = this.transactionRepository.create({
        userId,
        type: 'credit',
        service: 'reversal',
        amount: sellingPrice,
        status: 'success',
        reference: refundRef,
        metadata: { originalReference: ref, reason: 'Failed airtime purchase refund' },
      });
      await this.transactionRepository.save(refundTx);

      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        refunded: true,
        autoRefunded: true,
        refundedAt: new Date().toISOString(),
        refundReference: refundRef,
      };
      await this.transactionRepository.save(systemTx);

      await this.walletService.credit(userId, sellingPrice, `Refund for failed Airtime recharge (${ref})`);
      throw new BadRequestException(result?.data?.msg || result?.msg || 'Unable to complete airtime recharge with the provider.');
    }
  }

  async getElectricityDiscos() {
    return [
      { id: 'ikeja-electric', name: 'Ikeja Electric (IKEDC)' },
      { id: 'eko-electric', name: 'Eko Electric (EKEDC)' },
      { id: 'abuja-electric', name: 'Abuja Electric (AEDC)' },
      { id: 'kano-electric', name: 'Kano Electric (KEDCO)' },
      { id: 'portharcourt-electric', name: 'Port Harcourt (PHED)' },
      { id: 'ibadan-electric', name: 'Ibadan Electric (IBEDC)' },
      { id: 'kaduna-electric', name: 'Kaduna Electric (KAEDCO)' },
      { id: 'jos-electric', name: 'Jos Electric (JED)' },
      { id: 'enugu-electric', name: 'Enugu Electric (EEDC)' },
      { id: 'benin-electric', name: 'Benin Electric (BEDC)' },
      { id: 'aba-electric', name: 'Aba Electric (ABA)' },
      { id: 'yola-electric', name: 'Yola Electric (YEDC)' }
    ];
  }

  async getCableProviders() {
    return [
      { id: 'dstv', name: 'DStv' },
      { id: 'gotv', name: 'GOtv' },
      { id: 'startimes', name: 'StarTimes' },
      { id: 'showmax', name: 'Showmax' }
    ];
  }

  async getCablePackages(serviceId: string) {
    const response = await this.iacafeService.getVariations('cable', serviceId);
    if (response && response.code === 'success' && response.data) {
      return response.data;
    }
    return [];
  }

  async verifyCustomer(payload: any) {
    const { customerId, serviceId, variationId } = payload;
    return this.iacafeService.verifyCustomer(customerId, serviceId, variationId);
  }

  calculateServiceFee(amount: number, settings: any): number {
    if (!settings || !settings.serviceFeeEnabled) return 0;
    if (amount >= Number(settings.serviceFeeMinAmount) && amount <= Number(settings.serviceFeeMaxAmount)) {
      return Number(settings.serviceFeeAmount);
    }
    return 0;
  }

  async payElectricity(userId: string, payload: any) {
    const { disco, meterNumber, meterType, amount, pin } = payload;
    await this.usersService.verifyTransactionPin(userId, pin);

    const settings = await this.adminService.getSettings();
    const fee = this.calculateServiceFee(amount, settings);
    const totalDebit = Number(amount) + Number(fee);

    // Debit user's wallet
    await this.walletService.debit(
      userId,
      totalDebit,
      `Electricity bill payment (${disco.toUpperCase()} - ${meterType.toUpperCase()}) for Meter: ${meterNumber}`
    );

    const ref = 'ELC' + Math.random().toString(36).substring(2, 12).toUpperCase();

    // Log pending system transaction
    const systemTx = this.transactionRepository.create({
      userId,
      type: 'debit',
      service: 'electricity',
      amount: totalDebit,
      status: 'pending',
      reference: ref,
      metadata: { disco, meterNumber, meterType, baseAmount: amount, serviceFee: fee },
    });
    await this.transactionRepository.save(systemTx);

    // Call IACAFE API
    const result = await this.iacafeService.payElectricity(
      ref,
      meterNumber,
      disco,
      meterType,
      amount
    );

    if (result && result.code === 'success' && result.data) {
      const finalStatus = 'success';
      systemTx.status = finalStatus;
      systemTx.metadata = {
        ...systemTx.metadata,
        token: result.data.token || '',
        units: result.data.units || '',
        band: result.data.band || '',
        customerName: result.data.customer_name || '',
        customerAddress: result.data.customer_address || '',
        orderId: result.data.order_id,
        amountCharged: result.data.amount_charged,
        discount: result.data.discount,
      };
      await this.transactionRepository.save(systemTx);

      return {
        reference: ref,
        disco,
        meterNumber,
        token: result.data.token || '',
        units: result.data.units || '',
        band: result.data.band || '',
        customerName: result.data.customer_name || '',
      };
    } else if (result && result.isTransientError) {
      // Transient error (timeout / gateway error) - do NOT refund, keep status pending
      systemTx.status = 'pending';
      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        error: result.msg || 'Gateway timeout or server error. Processing status is pending.',
      };
      await this.transactionRepository.save(systemTx);

      throw new BadRequestException('Your transaction is currently processing on the network. Please check your transaction history shortly to retrieve your token.');
    } else {
      // Failure flow
      systemTx.status = 'failed';
      
      // Log system-wide refund transaction
      const refundRef = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const refundTx = this.transactionRepository.create({
        userId,
        type: 'credit',
        service: 'reversal',
        amount: totalDebit,
        status: 'success',
        reference: refundRef,
        metadata: { originalReference: ref, reason: 'Failed electricity payment refund' },
      });
      await this.transactionRepository.save(refundTx);

      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        refunded: true,
        autoRefunded: true,
        refundedAt: new Date().toISOString(),
        refundReference: refundRef,
        error: result?.msg || result?.message || 'Transaction failed on provider gateway',
      };
      await this.transactionRepository.save(systemTx);

      // Refund the wallet
      await this.walletService.credit(userId, totalDebit, `Refund for failed Electricity purchase (${ref})`);

      throw new BadRequestException(result?.msg || result?.message || 'Unable to complete electricity payment with provider.');
    }
  }

  async payCable(userId: string, payload: any) {
    const { provider, smartCardNumber, packageName, amount, pin } = payload;
    await this.usersService.verifyTransactionPin(userId, pin);

    const settings = await this.adminService.getSettings();
    const fee = this.calculateServiceFee(amount, settings);
    const totalDebit = Number(amount) + Number(fee);

    // Debit user's wallet
    await this.walletService.debit(
      userId,
      totalDebit,
      `Cable TV subscription renewal (${provider.toUpperCase()} - ${packageName}) for Decoder: ${smartCardNumber}`
    );

    const ref = 'CAB' + Math.random().toString(36).substring(2, 12).toUpperCase();

    // Log pending system transaction
    const systemTx = this.transactionRepository.create({
      userId,
      type: 'debit',
      service: 'cable',
      amount: totalDebit,
      status: 'pending',
      reference: ref,
      metadata: { provider, smartCardNumber, packageName, baseAmount: amount, serviceFee: fee },
    });
    await this.transactionRepository.save(systemTx);

    // Call IACAFE API
    const result = await this.iacafeService.payCable(
      ref,
      smartCardNumber,
      provider,
      packageName,
      amount
    );

    if (result && result.code === 'success' && result.data) {
      const finalStatus = 'success';
      systemTx.status = finalStatus;
      systemTx.metadata = {
        ...systemTx.metadata,
        customerName: result.data.customer_name || '',
        bouquet: result.data.bouquet || '',
        subscriptionType: result.data.subscription_type || '',
        orderId: result.data.order_id,
        amountCharged: result.data.amount_charged,
        discount: result.data.discount,
      };
      await this.transactionRepository.save(systemTx);

      return {
        reference: ref,
        provider,
        smartCardNumber,
        packageName,
        customerName: result.data.customer_name || '',
        bouquet: result.data.bouquet || '',
      };
    } else if (result && result.isTransientError) {
      // Transient error (timeout / gateway error) - do NOT refund, keep status pending
      systemTx.status = 'pending';
      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        error: result.msg || 'Gateway timeout or server error. Processing status is pending.',
      };
      await this.transactionRepository.save(systemTx);

      throw new BadRequestException('Your transaction is currently processing on the network. Please check your transaction history shortly to verify renewal.');
    } else {
      // Failure flow
      systemTx.status = 'failed';
      
      // Log system-wide refund transaction
      const refundRef = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const refundTx = this.transactionRepository.create({
        userId,
        type: 'credit',
        service: 'reversal',
        amount: totalDebit,
        status: 'success',
        reference: refundRef,
        metadata: { originalReference: ref, reason: 'Failed cable payment refund' },
      });
      await this.transactionRepository.save(refundTx);

      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        refunded: true,
        autoRefunded: true,
        refundedAt: new Date().toISOString(),
        refundReference: refundRef,
        error: result?.msg || result?.message || 'Transaction failed on provider gateway',
      };
      await this.transactionRepository.save(systemTx);

      // Refund the wallet
      await this.walletService.credit(userId, totalDebit, `Refund for failed Cable purchase (${ref})`);

      throw new BadRequestException(result?.msg || result?.message || 'Unable to complete cable payment with provider.');
    }
  }

  async getElectricityTokens(userId: string, meterNumber: string) {
    if (!meterNumber || !meterNumber.trim()) {
      throw new BadRequestException('Meter number is required');
    }

    // Search for successful electricity transactions for this user with matching meter number
    const transactions = await this.transactionRepository
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .andWhere('t.service = :service', { service: 'electricity' })
      .andWhere("t.status IN (:...statuses)", { statuses: ['success', 'pending'] })
      .andWhere("t.metadata->>'meterNumber' = :meterNumber", { meterNumber: meterNumber.trim() })
      .orderBy('t.createdAt', 'DESC')
      .limit(20)
      .getMany();

    return transactions.map((tx) => ({
      reference: tx.reference,
      amount: tx.amount,
      status: tx.status,
      date: tx.createdAt,
      disco: tx.metadata?.disco || '',
      meterType: tx.metadata?.meterType || '',
      token: tx.metadata?.token || '',
      units: tx.metadata?.units || '',
      customerName: tx.metadata?.customerName || '',
      customerAddress: tx.metadata?.customerAddress || '',
    }));
  }
}

