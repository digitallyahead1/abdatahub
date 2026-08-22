import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { DataPlan } from '../entities/data-plan.entity';
import { DataTransaction } from '../entities/data-transaction.entity';
import { Transaction } from '../entities/transaction.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { ApiKey } from '../entities/api-key.entity';
import { WalletService } from '../wallet/wallet.service';
import { SmePlugService } from '../services/smeplug.service';
import { SwiftbillsService } from '../services/swiftbills.service';
import { UsersService } from '../users/users.service';
import axios from 'axios';

@Injectable()
export class PublicApiService {
  private readonly logger = new Logger(PublicApiService.name);

  // Supported networks — extended dynamically as provider returns more
  private readonly NETWORK_MAP: Record<string, { id: number; name: string; code: string }> = {
    mtn: { id: 1, name: 'MTN', code: 'mtn' },
    airtel: { id: 2, name: 'Airtel', code: 'airtel' },
    glo: { id: 3, name: 'Glo', code: 'glo' },
    '9mobile': { id: 4, name: '9mobile', code: '9mobile' },
  };

  constructor(
    @InjectRepository(DataPlan)
    private dataPlanRepository: Repository<DataPlan>,
    @InjectRepository(DataTransaction)
    private dataTransactionRepository: Repository<DataTransaction>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(IdempotencyKey)
    private idempotencyRepository: Repository<IdempotencyKey>,
    private walletService: WalletService,
    private smePlugService: SmePlugService,
    private swiftbillsService: SwiftbillsService,
    private usersService: UsersService,
  ) {}

  // ─── Networks ────────────────────────────────────────────────────────────────

  async getNetworks() {
    // Get distinct networks from DB plans
    const plans = await this.dataPlanRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.network', 'network')
      .where('p.visibilityStatus = true')
      .getRawMany();

    const networks = plans.map(p => {
      const code = p.network as string;
      const known = this.NETWORK_MAP[code] || { id: 0, name: code.toUpperCase(), code };
      return {
        id: known.id,
        name: known.name,
        code: code,
        status: 'active',
      };
    });
    return networks;
  }

  async getNetwork(networkCode: string) {
    const code = networkCode.toLowerCase();
    const exists = await this.dataPlanRepository.findOne({
      where: { network: code, visibilityStatus: true },
    });
    if (!exists) throw new NotFoundException(`Network '${networkCode}' not found or has no active plans`);
    const known = this.NETWORK_MAP[code] || { id: 0, name: code.toUpperCase(), code };
    return { id: known.id, name: known.name, code, status: 'active' };
  }

  // ─── Data Plans ───────────────────────────────────────────────────────────

  async getDataPlans(networkFilter?: string, statusFilter?: string) {
    const query = this.dataPlanRepository.createQueryBuilder('plan');

    if (statusFilter === 'active' || !statusFilter) {
      query.andWhere('plan.visibilityStatus = :vis', { vis: true });
    }
    if (networkFilter) {
      query.andWhere('plan.network = :net', { net: networkFilter.toLowerCase() });
    }

    query.orderBy('plan.network', 'ASC').addOrderBy('plan.sellingPrice', 'ASC');
    const plans = await query.getMany();

    return plans.map(p => this.formatPlan(p));
  }

  async getDataPlan(planId: string) {
    const plan = await this.dataPlanRepository.findOne({
      where: { id: planId, visibilityStatus: true },
    });
    if (!plan) throw new NotFoundException(`Data plan '${planId}' not found`);
    return this.formatPlan(plan);
  }

  private formatPlan(p: DataPlan) {
    return {
      id: p.id,
      provider_plan_id: p.smeplugPlanId,
      network: p.network,
      name: p.bundleName,
      price: p.sellingPrice,
      provider_price: p.smeplugCost,
      provider: p.provider || 'smeplug',
      status: p.visibilityStatus ? 'active' : 'inactive',
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    };
  }

  // ─── Purchase ─────────────────────────────────────────────────────────────

  async purchaseData(
    userId: string,
    apiKeyId: string,
    payload: {
      network: string;
      plan_id: string;
      phone: string;
      idempotency_key?: string;
    },
  ) {
    const { network, plan_id, phone, idempotency_key } = payload;

    // 1. Idempotency check
    if (idempotency_key) {
      const existing = await this.idempotencyRepository.findOne({
        where: { key: idempotency_key, userId },
      });
      if (existing && existing.expiresAt > new Date()) {
        this.logger.log(`Idempotency hit for key ${idempotency_key} — returning cached response`);
        return existing.response;
      }
    }

    // 2. Validate phone
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw new BadRequestException('Invalid phone number. Must be 10 or 11 digits.');
    }

    // 3. Lookup plan
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(plan_id);
    const plan = isUuid
      ? await this.dataPlanRepository.findOne({ where: { id: plan_id } })
      : await this.dataPlanRepository.findOne({ where: { smeplugPlanId: parseInt(plan_id, 10), network: network?.toLowerCase() } });

    if (!plan || !plan.visibilityStatus) {
      throw new NotFoundException('Data plan not found or is currently inactive.');
    }

    // 4. Check user
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('User account not found.');

    // 5. Determine price
    const amount = user.role === 'agent' && Number(plan.agentPrice) > 0
      ? Number(plan.agentPrice)
      : Number(plan.sellingPrice);

    // 6. Generate transaction reference
    const ref = `DATA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto()
      .toString(36).substring(2, 10).toUpperCase()}`;

    // 7. Debit wallet
    await this.walletService.debit(
      userId,
      amount,
      `API: Data subscription (${plan.network.toUpperCase()} - ${plan.bundleName}) for ${cleanPhone}`,
    );

    // 8. Create transaction records
    const profit = amount - Number(plan.smeplugCost);
    const dataTx = this.dataTransactionRepository.create({
      userId,
      network: plan.network,
      planId: plan.smeplugPlanId.toString(),
      bundleName: plan.bundleName,
      phoneNumber: cleanPhone,
      smeplugCost: plan.smeplugCost,
      sellingPrice: amount,
      profit,
      transactionReference: ref,
      status: 'processing',
      apiKeyId,
    });
    await this.dataTransactionRepository.save(dataTx);

    const systemTx = this.transactionRepository.create({
      userId,
      type: 'debit',
      service: 'data',
      amount,
      status: 'pending',
      reference: ref,
      metadata: { phoneNumber: cleanPhone, network: plan.network, planName: plan.bundleName, profit, provider: plan.provider || 'smeplug', source: 'api' },
    });
    await this.transactionRepository.save(systemTx);

    // 9. Call provider
    let providerResult: any;
    try {
      if (plan.provider === 'swiftbills') {
        providerResult = await this.swiftbillsService.purchaseData(plan.network, cleanPhone, plan.smeplugPlanId, ref);
      } else if (plan.provider === 'amzaet') {
        const amzaetToken = process.env.AMZAET_TOKEN;
        if (!amzaetToken) throw new Error('AMZAET service is not configured.');
        const resp = await axios.post('https://amzaet.com/api/data/', {
          network: 1, mobile_number: cleanPhone, plan: plan.smeplugPlanId, Ported_number: true,
        }, { headers: { Authorization: `Token ${amzaetToken}` }, timeout: 30000 });
        const rawStatus = String(resp.data?.Status || resp.data?.status || '').toLowerCase();
        providerResult = {
          status: rawStatus === 'success' || rawStatus === 'true' || resp.data?.id != null,
          msg: resp.data?.api_response || resp.data?.message || 'Processed',
          providerTransactionId: String(resp.data?.id || ''),
        };
      } else {
        providerResult = await this.smePlugService.purchaseData(
          this.NETWORK_MAP[plan.network]?.id || 1,
          plan.smeplugPlanId,
          cleanPhone,
          ref,
        );
      }
    } catch (err: any) {
      providerResult = { status: false, msg: err.message };
    }

    // 10. Update transaction status
    const success = providerResult?.status === true || providerResult?.current_status === 'success';
    const newStatus = success ? 'success' : 'failed';

    dataTx.status = newStatus;
    dataTx.providerResponse = providerResult;
    dataTx.providerTransactionId = providerResult?.transactionId || providerResult?.orderId || null;
    dataTx.completedAt = new Date();
    if (!success) dataTx.failureReason = providerResult?.msg || 'Provider rejected the request';
    await this.dataTransactionRepository.save(dataTx);

    systemTx.status = newStatus;
    await this.transactionRepository.save(systemTx);

    // 11. Refund on failure
    if (!success) {
      try {
        await this.walletService.deposit(userId, amount, 'refund', `REF-${ref}`);
      } catch (refundErr: any) {
        this.logger.error(`Failed to refund user ${userId} for failed API data purchase: ${refundErr.message}`);
      }
    }

    // 12. Build response
    const result = {
      transaction_reference: ref,
      network: plan.network,
      plan: plan.bundleName,
      phone: cleanPhone,
      amount,
      status: newStatus,
      provider_transaction_id: dataTx.providerTransactionId,
      completed_at: dataTx.completedAt,
      message: success ? `Data subscription sent to ${cleanPhone}` : (dataTx.failureReason || 'Transaction failed'),
    };

    // 13. Store idempotency result
    if (idempotency_key && success) {
      const exp = new Date();
      exp.setHours(exp.getHours() + 24);
      try {
        await this.idempotencyRepository.save(
          this.idempotencyRepository.create({ key: idempotency_key, userId, response: result, statusCode: 201, expiresAt: exp }),
        );
      } catch (_) { /* key already exists race condition — ignore */ }
    }

    return result;
  }

  // ─── Transactions ────────────────────────────────────────────────────────

  async getTransactions(userId: string, page = 1, limit = 20, statusFilter?: string) {
    const query = this.dataTransactionRepository.createQueryBuilder('tx')
      .where('tx.userId = :uid', { uid: userId });

    if (statusFilter) query.andWhere('tx.status = :s', { s: statusFilter });

    const [items, total] = await query
      .orderBy('tx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: items.map(t => this.formatTransaction(t)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTransaction(userId: string, reference: string) {
    const tx = await this.dataTransactionRepository.findOne({
      where: { transactionReference: reference, userId },
    });
    if (!tx) throw new NotFoundException(`Transaction '${reference}' not found`);
    return this.formatTransaction(tx);
  }

  private formatTransaction(t: DataTransaction) {
    return {
      id: t.id,
      reference: t.transactionReference,
      network: t.network,
      plan: t.bundleName,
      phone: t.phoneNumber,
      amount: t.sellingPrice,
      status: t.status,
      failure_reason: t.failureReason || null,
      provider_transaction_id: t.providerTransactionId || null,
      created_at: t.createdAt,
      completed_at: t.completedAt || null,
    };
  }
}

function crypto() {
  const { randomBytes } = require('crypto');
  return randomBytes(4).readUInt32LE(0);
}
