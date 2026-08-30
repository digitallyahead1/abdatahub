import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Transaction } from '../entities/transaction.entity';
import { DataPlan } from '../entities/data-plan.entity';
import { AirtimePricing } from '../entities/airtime-pricing.entity';
import { DataTransaction } from '../entities/data-transaction.entity';
import { AirtimeTransaction } from '../entities/airtime-transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import { SmePlugService } from './smeplug.service';
import { IacafeService } from './iacafe.service';
import { SwiftbillsService } from './swiftbills.service';
import { AdminService } from '../admin/admin.service';
import { UsersService } from '../users/users.service';
import { formatToWatIso } from '../common/date.util';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private walletService: WalletService,
    private smePlugService: SmePlugService,
    private iacafeService: IacafeService,
    private swiftbillsService: SwiftbillsService,
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

  async getDataPlans(userId?: string) {
    const plans = await this.dataPlanRepository.find({
      where: { visibilityStatus: true },
      order: { network: 'ASC', sellingPrice: 'ASC' },
    });

    if (userId) {
      const user = await this.usersService.findOneById(userId);
      if (user && user.role === 'agent') {
        return plans.map((plan) => {
          const agentPrice = Number(plan.agentPrice);
          if (agentPrice > 0) {
            return {
              ...plan,
              sellingPrice: agentPrice,
            };
          }
          return plan;
        });
      }
    }
    return plans;
  }

  async getSettingsForUsers() {
    return this.adminService.getSettings();
  }

  async getAirtimePricing(userId?: string) {
    const rates = await this.airtimePricingRepository.find({
      where: { visibilityStatus: true },
    });

    if (userId) {
      const user = await this.usersService.findOneById(userId);
      if (user && user.role === 'agent') {
        return rates.map((rate) => {
          const agentRate = Number(rate.agentRate);
          if (agentRate > 0) {
            return {
              ...rate,
              sellingRate: agentRate,
            };
          }
          return rate;
        });
      }
    }
    return rates;
  }

  async purchaseData(userId: string, payload: any) {
    const { phoneNumber, network, planId, pin } = payload;
    await this.usersService.verifyTransactionPin(userId, pin);
    
    const planIdStr = String(planId || '').trim();
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(planIdStr);
    
    let plan: DataPlan | null = null;
    if (isUuid) {
      plan = await this.dataPlanRepository.findOne({ where: { id: planIdStr } });
    } else if (/^\d+$/.test(planIdStr)) {
      const planIdNum = parseInt(planIdStr, 10);
      const whereCondition: any = { smeplugPlanId: planIdNum };
      if (network) {
        whereCondition.network = network.toLowerCase().trim();
      }
      plan = await this.dataPlanRepository.findOne({ where: whereCondition });
    } else {
      plan = await this.dataPlanRepository.findOne({ where: { id: planIdStr } });
    }

    if (!plan) {
      throw new BadRequestException('The selected data plan was not found.');
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    let amount = plan.sellingPrice;
    if (user.role === 'agent' && Number(plan.agentPrice) > 0) {
      amount = Number(plan.agentPrice);
    }
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
      metadata: { phoneNumber, network: plan.network, planName, profit, provider: plan.provider || 'smeplug' },
    });
    await this.transactionRepository.save(systemTx);

    let result: any;

    if (plan.provider === 'swiftbills') {
      this.logger.log(`Purchasing data via Swiftbills API for plan ${plan.smeplugPlanId} (${plan.bundleName}) on phone ${phoneNumber}`);
      result = await this.swiftbillsService.purchaseData(
        plan.network,
        phoneNumber,
        plan.smeplugPlanId,
        ref,
      );
    } else if (plan.provider === 'amzaet') {
      const amzaetToken = process.env.AMZAET_TOKEN;
      if (!amzaetToken) {
        this.logger.error('AMZAET_TOKEN is not configured in the environment variables.');
        throw new Error('AMZAET service is temporarily unavailable due to configuration error.');
      }
      this.logger.log(`Purchasing data via AMZAET API for plan ${plan.smeplugPlanId} on phone ${phoneNumber}`);

      try {
        const response = await axios.post(
          'https://amzaet.com/api/data/',
          {
            network: 1, // MTN is 1 in AMZAET
            mobile_number: phoneNumber,
            plan: plan.smeplugPlanId,
            Ported_number: true,
          },
          {
            headers: {
              Authorization: `Token ${amzaetToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );
        this.logger.log(`AMZAET API Response [HTTP ${response.status}]: ${JSON.stringify(response.data)}`);
        
        const rawStatus = response.data?.Status || response.data?.status || response.data?.current_status || '';
        const statusStr = String(rawStatus).toLowerCase();

        const rawMsg = response.data?.api_response || response.data?.message || response.data?.detail || '';
        const msg = String(rawMsg).toLowerCase();

        // Explicit failure indicators in the response body
        const isExplicitFailure =
          statusStr === 'false' ||
          statusStr === 'failed' ||
          statusStr === 'error' ||
          msg.includes('failed') ||
          msg.includes('error') ||
          msg.includes('insufficient');

        // If HTTP 2xx and no explicit failure in body → treat as success
        // AMZAET may return "successful", "200", "created", "processing", etc.
        const isSuccess =
          !isExplicitFailure &&
          (response.status >= 200 && response.status < 300) &&
          (
            statusStr === 'success' ||
            statusStr === 'successful' ||
            statusStr === 'true' ||
            statusStr === '200' ||
            statusStr === 'created' ||
            statusStr === 'processing' ||
            msg.includes('success') ||
            msg.includes('successful') ||
            msg.includes('submitted') ||
            msg.includes('processing') ||
            // If response has an id/plan field, the order was accepted
            response.data?.id != null ||
            response.data?.plan != null
          );

        if (isSuccess) {
          result = {
            status: true,
            current_status: 'success',
          };
        } else {
          const failMsg =
            (Array.isArray(response.data?.error) && response.data.error[0]) ||
            response.data?.message ||
            response.data?.detail ||
            'Provider returned an unrecognised response';
          this.logger.warn(`AMZAET returned non-success body: ${JSON.stringify(response.data)}`);
          result = {
            status: false,
            current_status: 'failed',
            msg: failMsg,
          };
        }
      } catch (err: any) {
        // Distinguish transient errors (timeout, network, 5xx) from hard API failures
        const isTransient = !err.response || err.response.status >= 500 || err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        const amzaetErrorData = err.response?.data;
        let amzaetMsg = '';

        if (typeof amzaetErrorData === 'string') {
          amzaetMsg = amzaetErrorData;
        } else if (Array.isArray(amzaetErrorData) && amzaetErrorData.length > 0) {
          amzaetMsg = typeof amzaetErrorData[0] === 'string' ? amzaetErrorData[0] : JSON.stringify(amzaetErrorData[0]);
        } else if (amzaetErrorData && typeof amzaetErrorData === 'object') {
          const directMsg = amzaetErrorData.detail || amzaetErrorData.message || amzaetErrorData.api_response || (Array.isArray(amzaetErrorData.error) && amzaetErrorData.error[0]);
          if (directMsg) {
            amzaetMsg = directMsg;
          } else {
            // Extract error from first field property (e.g. { plan: ['Invalid pk...'] })
            const firstKey = Object.keys(amzaetErrorData)[0];
            const val = firstKey ? amzaetErrorData[firstKey] : null;
            if (Array.isArray(val) && val.length > 0) {
              amzaetMsg = `${firstKey}: ${val[0]}`;
            } else if (typeof val === 'string') {
              amzaetMsg = `${firstKey}: ${val}`;
            } else {
              amzaetMsg = err.message;
            }
          }
        } else {
          amzaetMsg = err.message;
        }

        this.logger.error(`AMZAET API call failed (transient=${isTransient}): ${JSON.stringify(amzaetErrorData || err.message)}`);
        result = {
          status: false,
          current_status: isTransient ? 'pending' : 'failed',
          msg: amzaetMsg,
          isTransientError: isTransient,
        };
      }
    } else {
      // 4. Map network to SMEPlug ID
      const networkMap: Record<string, number> = {
        mtn: 1,
        airtel: 2,
        '9mobile': 3,
        glo: 4,
      };
      const networkId = networkMap[plan.network.toLowerCase()];

      // 5. Call SMEPlug API
      this.logger.log(`Sending SMEPlug Data Purchase: networkId=${networkId}, smeplugPlanId=${plan.smeplugPlanId} (${plan.bundleName}), phone=${phoneNumber}, ref=${ref}`);
      result = await this.smePlugService.purchaseData(
        networkId,
        plan.smeplugPlanId,
        phoneNumber,
        ref,
      );
    }

    // 6. Handle success or rollback on failure
    if (result && (result.status === true || result.current_status === 'success' || result.current_status === 'processing')) {
      const finalStatus = result.current_status === 'failed' ? 'failed' : 'success';
      
      dataTx.status = finalStatus;
      await this.dataTransactionRepository.save(dataTx);

      systemTx.status = finalStatus;
      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        providerReference: result.data?.reference || result.reference || '',
      };
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

        let rawErr = result?.data?.msg || result?.msg || 'Data purchase transaction failed on provider gateway';
        if (typeof rawErr === 'string' && rawErr.toLowerCase().includes('insufficient')) {
          rawErr = 'Provider Gateway Error: Insufficient balance on API provider account (swiftbills/amzaet/smeplug). Please contact admin to top up provider API wallet.';
        }
        throw new BadRequestException(rawErr);
      }

      return {
        reference: ref,
        providerReference: result.data?.reference || '',
        network: plan.network,
        planName,
        phoneNumber,
        amount,
        status: finalStatus,
        createdAt: formatToWatIso(systemTx.createdAt || new Date()),
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

      let rawErr = result?.data?.msg || result?.msg || 'Unable to complete data purchase with the provider.';
      if (typeof rawErr === 'string' && rawErr.toLowerCase().includes('insufficient')) {
        rawErr = 'Provider Gateway Error: Insufficient balance on API provider account (amzaet/smeplug). Please contact admin to top up provider API wallet.';
      }
      throw new BadRequestException(rawErr);
    }
  }

  async purchaseAirtime(userId: string, payload: any) {
    const { phoneNumber, network, amount, pin } = payload;
    await this.usersService.verifyTransactionPin(userId, pin);
    const cleanNetwork = network.toLowerCase();

    if (Number(amount) < 100) {
      throw new BadRequestException('Minimum airtime purchase amount is ₦100.');
    }

    // 1. Look up airtime pricing rate
    const pricing = await this.airtimePricingRepository.findOne({
      where: { network: cleanNetwork, visibilityStatus: true },
    });

    if (!pricing) {
      throw new BadRequestException('Airtime service is currently disabled for this network.');
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    let rate = pricing.sellingRate;
    if (user.role === 'agent') {
      rate = pricing.agentRate;
    }

    const sellingPrice = Number(amount) * Number(rate);
    const providerCost = Number(amount) * Number(pricing.smeplugRate);
    const profit = sellingPrice - providerCost;

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
      smeplugCost: providerCost,
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
      metadata: { phoneNumber, network: cleanNetwork, faceValue: amount, profit, provider: 'iacafe' },
    });
    await this.transactionRepository.save(systemTx);

    // 4. Map network to IACAFE service_id
    const iacafeServiceMap: Record<string, string> = {
      mtn: 'mtn',
      glo: 'glo',
      '9mobile': '9mobile',
      etisalat: '9mobile',
      airtel: 'airtel',
    };
    const iacafeServiceId = iacafeServiceMap[cleanNetwork];

    if (!iacafeServiceId) {
      // Refund and fail if network unknown
      await this.walletService.credit(userId, sellingPrice, `Refund for unsupported network (${cleanNetwork}) - ${ref}`);
      airtimeTx.status = 'failed';
      await this.airtimeTransactionRepository.save(airtimeTx);
      systemTx.status = 'failed';
      await this.transactionRepository.save(systemTx);
      throw new BadRequestException(`Airtime is not supported for network: ${cleanNetwork}`);
    }

    // 5. Call IACAFE API for airtime
    const result = await this.iacafeService.payAirtime(
      ref,
      phoneNumber,
      iacafeServiceId,
      Number(amount)
    );

    const isSuccess = result && (
      result.code === 'success' ||
      result.code === 200 ||
      result.status === true ||
      result.status === 'success' ||
      result.status === 'completed-api'
    );

    if (isSuccess) {
      const finalStatus = 'success';
      airtimeTx.status = finalStatus;
      await this.airtimeTransactionRepository.save(airtimeTx);

      const providerRef = String(result.data?.order_id || result.data?.id || result.order_id || result.id || '');
      systemTx.status = finalStatus;
      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        providerReference: providerRef,
        providerResponse: result.data || result,
      };
      await this.transactionRepository.save(systemTx);

      return {
        reference: ref,
        providerReference: providerRef,
        network: cleanNetwork,
        phoneNumber,
        amount,
        chargedAmount: sellingPrice,
        status: finalStatus,
        createdAt: formatToWatIso(systemTx.createdAt || new Date()),
      };
    } else if (result && result.isTransientError) {
      // Transient error (timeout / provider 5xx) - keep status pending so admin or user can requery
      airtimeTx.status = 'pending';
      await this.airtimeTransactionRepository.save(airtimeTx);

      systemTx.status = 'pending';
      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        error: result.msg || 'Gateway timeout or server error. Processing status is pending.',
      };
      await this.transactionRepository.save(systemTx);

      throw new BadRequestException('Your airtime transaction is currently processing on the network. Please check your transaction history shortly.');
    } else {
      // Hard failure — refund the user
      airtimeTx.status = 'failed';
      await this.airtimeTransactionRepository.save(airtimeTx);

      systemTx.status = 'failed';
      const refundRef = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const refundTx = this.transactionRepository.create({
        userId,
        type: 'credit',
        service: 'reversal',
        amount: sellingPrice,
        status: 'success',
        reference: refundRef,
        metadata: { originalReference: ref, reason: 'Failed airtime purchase refund (IACAFE)' },
      });
      await this.transactionRepository.save(refundTx);

      const errorDetail = result?.msg || result?.error?.message || result?.error || 'Airtime purchase failed on provider.';
      systemTx.metadata = {
        ...(systemTx.metadata || {}),
        refunded: true,
        autoRefunded: true,
        refundedAt: new Date().toISOString(),
        refundReference: refundRef,
        error: errorDetail,
      };
      await this.transactionRepository.save(systemTx);

      await this.walletService.credit(userId, sellingPrice, `Refund for failed Airtime recharge (${ref})`);

      throw new BadRequestException(errorDetail);
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
        amount: totalDebit,
        status: finalStatus,
        createdAt: formatToWatIso(systemTx.createdAt || new Date()),
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
        amount: totalDebit,
        status: finalStatus,
        createdAt: formatToWatIso(systemTx.createdAt || new Date()),
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

