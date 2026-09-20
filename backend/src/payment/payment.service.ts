import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UserVirtualAccount } from '../entities/user-virtual-account.entity';
import { GafiapayVirtualAccount } from '../entities/gafiapay-virtual-account.entity';
import { WalletService } from '../wallet/wallet.service';
import { Transaction } from '../entities/transaction.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import axios from 'axios';
import * as crypto from 'crypto';

// ─── Security Constants ────────────────────────────────────────────────────────
/** Maximum amount that can be credited in a single webhook deposit (₦200,000) */
const MAX_SINGLE_DEPOSIT = 200_000;
/** Maximum total amount that can be credited to one user within any 24-hour window (₦500,000) */
const MAX_DAILY_DEPOSIT = 500_000;
/** Monnify IPs — update when Monnify publishes new egress IPs */
const MONNIFY_ALLOWED_IPS = [
  '18.133.110.46', '3.9.94.169', '3.9.185.112',  // Monnify EU egress
  '127.0.0.1', '::1', '::ffff:127.0.0.1',         // localhost (dev/test)
];
/** Gafiapay IPs — add real IPs from Gafiapay docs/support */
const GAFIAPAY_ALLOWED_IPS = [
  '127.0.0.1', '::1', '::ffff:127.0.0.1',
];

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private readonly monnifyApiKey = process.env.MONNIFY_API_KEY || 'DEMOKEY000000';
  private readonly monnifySecretKey = process.env.MONNIFY_SECRET_KEY || 'DEMOKEY000000';
  private readonly monnifyContractCode = process.env.MONNIFY_CONTRACT_CODE || '5867418298';
  private readonly monnifyBaseUrl = process.env.MONNIFY_BASE_URL || 'https://api.monnify.com';

  private readonly gafiapayApiKey = process.env.GAFIAPAY_API_KEY;
  private readonly gafiapaySecretKey = process.env.GAFIAPAY_SECRET_KEY;
  private readonly gafiapayBaseUrl = process.env.GAFIAPAY_BASE_URL || 'https://api.gafiapay.com/api/v1/external';

  constructor(
    @InjectRepository(UserVirtualAccount)
    private readonly monnifyRepo: Repository<UserVirtualAccount>,
    @InjectRepository(GafiapayVirtualAccount)
    private readonly gafiapayRepo: Repository<GafiapayVirtualAccount>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly walletService: WalletService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ─── IP Allowlist Check ──────────────────────────────────────────────────────
  /**
   * Returns true if the request IP is in the provider's allowed list.
   * If DISABLE_WEBHOOK_IP_CHECK=true the check is skipped (use only in dev).
   */
  isAllowedWebhookIp(ip: string, allowed: string[]): boolean {
    if (process.env.DISABLE_WEBHOOK_IP_CHECK === 'true') return true;
    // Handle x-forwarded-for chains: take the first (client) IP
    const clientIp = (ip || '').split(',')[0].trim();
    return allowed.includes(clientIp);
  }

  // ─── Deposit Velocity Guard ──────────────────────────────────────────────────
  /**
   * Throws if the proposed `amount` would breach single-transaction or 24-hour
   * rolling deposit limits for the given user.
   */
  private async assertDepositLimits(userId: string, amount: number): Promise<void> {
    // 1. Single-transaction cap
    if (amount > MAX_SINGLE_DEPOSIT) {
      this.logger.error(
        `SECURITY: Deposit of ₦${amount} for user ${userId} exceeds ` +
        `single-transaction cap of ₦${MAX_SINGLE_DEPOSIT}. BLOCKED.`,
      );
      await this.auditLogService.log(
        userId, 'system@security', 'DEPOSIT_CAP_EXCEEDED',
        { amount, limit: MAX_SINGLE_DEPOSIT, type: 'single_tx' },
        'system',
      ).catch(() => {});
      throw new BadRequestException(
        `Deposit amount ₦${amount.toLocaleString()} exceeds the maximum allowed ` +
        `per transaction of ₦${MAX_SINGLE_DEPOSIT.toLocaleString()}. ` +
        `Contact support if you need to deposit a larger amount.`,
      );
    }

    // 2. 24-hour rolling window cap
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await this.transactionRepo.find({
      where: { userId, service: 'deposit', status: 'success' },
      select: ['amount', 'createdAt'],
    });
    const rollingTotal = rows
      .filter((r) => r.createdAt >= since)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    if (rollingTotal + amount > MAX_DAILY_DEPOSIT) {
      this.logger.error(
        `SECURITY: Deposit of ₦${amount} for user ${userId} would bring 24h total to ` +
        `₦${rollingTotal + amount}, exceeding daily cap of ₦${MAX_DAILY_DEPOSIT}. BLOCKED.`,
      );
      await this.auditLogService.log(
        userId, 'system@security', 'DEPOSIT_DAILY_LIMIT_EXCEEDED',
        { amount, rollingTotal, limit: MAX_DAILY_DEPOSIT },
        'system',
      ).catch(() => {});
      throw new BadRequestException(
        `This deposit would exceed your 24-hour funding limit of ` +
        `₦${MAX_DAILY_DEPOSIT.toLocaleString()}. You have already funded ` +
        `₦${rollingTotal.toLocaleString()} today. Contact support to raise your limit.`,
      );
    }
  }

  // ================= MONNIFY SERVICES =================

  async getMonnifyAccount(userId: string): Promise<UserVirtualAccount | null> {
    return this.monnifyRepo.findOne({ where: { userId, isActive: true } });
  }

  private async getMonnifyAccessToken(): Promise<string> {
    try {
      const apiKey = this.monnifyApiKey || process.env.MONNIFY_API_KEY || 'DEMOKEY000000';
      const secretKey = this.monnifySecretKey || process.env.MONNIFY_SECRET_KEY || 'DEMOKEY000000';
      const authString = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
      const response = await axios.post(
        `${this.monnifyBaseUrl}/api/v1/auth/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data?.responseBody?.accessToken) {
        return response.data.responseBody.accessToken;
      }
      throw new Error('Access token not found in Monnify response');
    } catch (error: any) {
      console.error('Monnify login failed:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        error.response?.data?.responseMessage || 'Failed to authenticate with Monnify',
      );
    }
  }

  async generateMonnifyAccount(userId: string, email: string, fullName: string): Promise<UserVirtualAccount> {
    const existing = await this.getMonnifyAccount(userId);
    if (existing) {
      return existing;
    }

    const token = await this.getMonnifyAccessToken();
    const accountReference = `USER_${userId.replace(/-/g, '')}_${Date.now()}`;
    const cleanedName = (fullName || 'Customer').replace(/[^a-zA-Z0-9.\s'-]/g, '').trim();

    try {
      const contractCode = this.monnifyContractCode || process.env.MONNIFY_CONTRACT_CODE || '5867418298';
      let resBody: any = null;

      // Try Monnify v2 reserved accounts endpoint
      try {
        const response = await axios.post(
          `${this.monnifyBaseUrl}/api/v2/bank-transfer/reserved-accounts`,
          {
            accountReference,
            accountName: `ABDATAHUB_${cleanedName}`,
            currencyCode: 'NGN',
            contractCode,
            customerEmail: email,
            customerName: cleanedName,
            getAllAvailableBanks: true,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        resBody = response.data?.responseBody;
      } catch (v2Err: any) {
        console.warn('Monnify v2 reserved account endpoint note, trying v1:', v2Err.response?.data?.responseMessage || v2Err.message);
        // Fallback to v1 endpoint
        const v1Response = await axios.post(
          `${this.monnifyBaseUrl}/api/v1/bank-transfer/reserved-accounts`,
          {
            accountReference,
            accountName: `ABDATAHUB_${cleanedName}`,
            currencyCode: 'NGN',
            contractCode,
            customerEmail: email,
            customerName: cleanedName,
            getAllAvailableBanks: true,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        resBody = v1Response.data?.responseBody;
      }

      if (!resBody || !resBody.accounts || resBody.accounts.length === 0) {
        throw new Error('No account details returned from Monnify reserved accounts endpoint');
      }

      const accountDetails = resBody.accounts[0];
      const newAccount = this.monnifyRepo.create({
        userId,
        accountReference: resBody.accountReference || accountReference,
        accountNumber: accountDetails.accountNumber,
        accountName: resBody.accountName || `ABDATAHUB_${cleanedName}`,
        bankName: accountDetails.bankName,
        isActive: true,
      });

      return await this.monnifyRepo.save(newAccount);
    } catch (error: any) {
      console.error('Monnify reserved account generation failed:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.responseMessage || 'Failed to generate Monnify permanent reserved account',
      );
    }
  }

  // ================= GAFIAPAY SERVICES =================

  async getActiveGafiapayAccount(userId: string): Promise<GafiapayVirtualAccount | null> {
    return this.gafiapayRepo.findOne({
      where: { userId, isActive: true },
    });
  }

  async generateGafiapayAccount(
    userId: string,
    email: string,
    fullName: string,
    idOrNin?: string,
    bvnOrIdType?: string,
  ): Promise<GafiapayVirtualAccount> {
    const active = await this.getActiveGafiapayAccount(userId);
    if (active) {
      return active;
    }

    const firstName = (fullName || '').trim().split(/\s+/)[0] || '';
    const cleanedFirstName = firstName.replace(/[^a-zA-Z0-9'-]/g, '');
    const capitalizedFirstName = cleanedFirstName.charAt(0).toUpperCase() + cleanedFirstName.slice(1);
    const accountName = `ABDATAHUB ${capitalizedFirstName}`.trim();

    const isExplicitIdType = bvnOrIdType === 'nin' || bvnOrIdType === 'bvn' || bvnOrIdType === 'auto';
    const cleanId = (idOrNin || '').trim() || (isExplicitIdType ? '' : (bvnOrIdType || '').trim());
    const preferredType: 'nin' | 'bvn' | 'auto' = isExplicitIdType
      ? (bvnOrIdType as 'nin' | 'bvn' | 'auto')
      : (bvnOrIdType ? 'bvn' : 'auto');

    const callGafia = async (type: 'bvn' | 'nin') => {
      const timestamp = Date.now().toString();
      const reqBody: Record<string, any> = {
        email,
        name: accountName,
        [type]: cleanId,
      };

      const bodyString = JSON.stringify(reqBody);
      const signString = `${bodyString}${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.gafiapaySecretKey || 'secret')
        .update(signString)
        .digest('hex');

      return await axios.post(
        `${this.gafiapayBaseUrl}/account/generate`,
        reqBody,
        {
          headers: {
            'x-api-key': this.gafiapayApiKey,
            'x-timestamp': timestamp,
            'x-signature': signature,
            'Content-Type': 'application/json',
          },
        },
      );
    };

    // Determine primary and fallback types
    const primaryType: 'bvn' | 'nin' = preferredType === 'bvn' ? 'bvn' : 'nin';
    const fallbackType: 'bvn' | 'nin' = primaryType === 'nin' ? 'bvn' : 'nin';

    let lastError: any = null;
    let responseData: any = null;

    try {
      const res = await callGafia(primaryType);
      responseData = res.data;
    } catch (primaryErr: any) {
      lastError = primaryErr;
      const errMsg = primaryErr.response?.data?.message || primaryErr.message || '';
      console.warn(
        `Gafiapay account generation with ${primaryType.toUpperCase()} failed (${errMsg}). Attempting automatic fallback with ${fallbackType.toUpperCase()}...`,
      );

      // Attempt fallback with the alternate identity type (e.g. BVN if user entered BVN in NIN field, or vice versa)
      try {
        const fallbackRes = await callGafia(fallbackType);
        responseData = fallbackRes.data;
        console.log(`Gafiapay fallback generation with ${fallbackType.toUpperCase()} succeeded!`);
      } catch (fallbackErr: any) {
        lastError = fallbackErr;
        console.error(
          `Gafiapay fallback with ${fallbackType.toUpperCase()} also failed:`,
          fallbackErr.response?.data || fallbackErr.message,
        );
      }
    }

    if (!responseData || responseData.status !== 'success' || !responseData.data) {
      const rawMsg = String(lastError?.response?.data?.message || lastError?.message || '');
      if (
        rawMsg.toLowerCase().includes('licensenumber verification failed') ||
        rawMsg.toLowerCase().includes('verification failed')
      ) {
        throw new BadRequestException(
          'Identity verification failed. Please check that your 11-digit NIN or BVN is correct and matches your account details.',
        );
      } else if (rawMsg.toLowerCase().includes('duplicate')) {
        throw new BadRequestException(
          'This NIN or BVN is already linked to an existing virtual account.',
        );
      }
      throw new BadRequestException(
        rawMsg || 'Failed to generate PalmPay permanent virtual account. Please verify your identity details.',
      );
    }

    const info = responseData.data;

    const permanentAccount = this.gafiapayRepo.create({
      userId,
      accountNumber: info.accountNumber,
      accountName: info.accountName,
      bankName: info.bankName,
      isActive: true,
    });

    return await this.gafiapayRepo.save(permanentAccount);
  }

  // ================= WEBHOOK PROCESSORS =================

  async processMonnifyWebhook(
    body: any,
    requestSignature: string,
    rawBodyString?: string,
    requestIp?: string,
  ): Promise<boolean> {
    // ─── 1. IP Allowlist ────────────────────────────────────────────────────────
    if (requestIp && !this.isAllowedWebhookIp(requestIp, MONNIFY_ALLOWED_IPS)) {
      this.logger.error(`SECURITY: Monnify webhook rejected — IP ${requestIp} not in allowlist`);
      await this.auditLogService.log(null, 'webhook@monnify.com', 'WEBHOOK_IP_BLOCKED',
        { ip: requestIp, provider: 'monnify' }, requestIp).catch(() => {});
      return false;
    }

    // ─── 2. HMAC Signature Verification ─────────────────────────────────────────
    const secretKey = this.monnifySecretKey || process.env.MONNIFY_SECRET_KEY || 'DEMOKEY000000';
    if (secretKey && secretKey !== 'DEMOKEY000000') {
      if (!requestSignature) {
        this.logger.error('SECURITY: Monnify webhook rejected — no signature header present');
        await this.auditLogService.log(null, 'webhook@monnify.com', 'WEBHOOK_NO_SIGNATURE',
          { provider: 'monnify', ip: requestIp }, requestIp).catch(() => {});
        return false;
      }

      const bodyForSigning = rawBodyString || (typeof body === 'string' ? body : JSON.stringify(body));
      const computedHmac = crypto
        .createHmac('sha512', secretKey)
        .update(bodyForSigning)
        .digest('hex');
      const computedHash = crypto
        .createHash('sha512')
        .update(secretKey + bodyForSigning)
        .digest('hex');

      // Monnify uses either HMAC-SHA512 or SHA512(secret+body) depending on version
      const sigValid =
        crypto.timingSafeEqual(Buffer.from(computedHmac, 'hex'), Buffer.from(requestSignature.padEnd(computedHmac.length, '0').substring(0, computedHmac.length), 'hex')) ||
        crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(requestSignature.padEnd(computedHash.length, '0').substring(0, computedHash.length), 'hex'));

      if (!sigValid) {
        this.logger.error(`SECURITY: Monnify webhook REJECTED — HMAC signature mismatch from IP ${requestIp}`);
        await this.auditLogService.log(null, 'webhook@monnify.com', 'WEBHOOK_SIG_MISMATCH',
          { provider: 'monnify', receivedSig: requestSignature?.substring(0, 16) + '...', ip: requestIp },
          requestIp).catch(() => {});
        return false;
      }
    } else {
      this.logger.warn('Monnify webhook: MONNIFY_SECRET_KEY not configured — skipping HMAC check (dev mode only)');
    }

    const { eventType, eventData } = body;
    if (eventType !== 'SUCCESSFUL_TRANSACTION' && eventType !== 'SUCCESSFUL_DISBURSEMENT') {
      console.log(`Monnify Webhook: Ignored event type ${eventType}`);
      return true;
    }

    if (!eventData) {
      console.warn('Monnify Webhook: Missing eventData');
      return false;
    }

    const amount = eventData.amountPaid || eventData.amount || eventData.settlementAmount || eventData.totalPayable;
    const paymentReference = eventData.paymentReference || eventData.transactionReference;
    const accountReference = eventData.accountReference || eventData.product?.reference;
    const destAccountNumber = eventData.destinationAccountInformation?.accountNumber;

    if (!paymentReference || !amount) {
      console.warn('Monnify Webhook rejected: missing required payment details', {
        paymentReference: !!paymentReference,
        amount: !!amount,
      });
      return false;
    }

    const existingTx = await this.transactionRepo.findOne({
      where: { reference: paymentReference },
    });
    if (existingTx) {
      console.log(`Monnify Webhook: Transaction ${paymentReference} already processed.`);
      return true;
    }

    // Identify user
    let userId: string | null = null;
    if (destAccountNumber || accountReference) {
      const userAccount = await this.monnifyRepo.findOne({
        where: [
          ...(destAccountNumber ? [{ accountNumber: destAccountNumber, isActive: true }] : []),
          ...(accountReference ? [{ accountReference, isActive: true }] : []),
        ],
      });
      if (userAccount) {
        userId = userAccount.userId;
      }
    }

    if (!userId && accountReference) {
      const parts = accountReference.split('_');
      if (parts.length >= 2) {
        let rawUserId = parts[1];
        if (rawUserId.length === 32) {
          rawUserId = `${rawUserId.substring(0, 8)}-${rawUserId.substring(8, 12)}-${rawUserId.substring(12, 16)}-${rawUserId.substring(16, 20)}-${rawUserId.substring(20)}`;
        }
        userId = rawUserId;
      }
    }

    if (!userId) {
      console.error(`Monnify Webhook: Could not associate transaction to user (accountReference: ${accountReference}, destAccount: ${destAccountNumber})`);
      return false;
    }

    try {
      const creditAmount = parseFloat(amount.toString());
      if (isNaN(creditAmount) || creditAmount <= 0) {
        this.logger.warn(`Monnify Webhook: Invalid amount "${amount}" - skipping`);
        return false;
      }

      // ─── 3. Deposit Velocity / Amount Limits ─────────────────────────────────
      await this.assertDepositLimits(userId, creditAmount);

      await this.walletService.deposit(userId, creditAmount, 'Monnify Bank Transfer', paymentReference);
      this.logger.log(`Monnify Webhook: Credited user ${userId} ₦${creditAmount} (ref: ${paymentReference})`);
      return true;
    } catch (err: any) {
      this.logger.error(`Monnify Webhook deposit failed for user ${userId}: ${err.message}`);
      return false;
    }
  }

  async processGafiapayWebhook(
    body: any,
    requestSignature: string,
    rawBodyString?: string,
    requestIp?: string,
  ): Promise<boolean> {
    // ─── 1. IP Allowlist ────────────────────────────────────────────────────────
    if (requestIp && !this.isAllowedWebhookIp(requestIp, GAFIAPAY_ALLOWED_IPS)) {
      this.logger.error(`SECURITY: Gafiapay webhook rejected — IP ${requestIp} not in allowlist`);
      await this.auditLogService.log(null, 'webhook@gafiapay.com', 'WEBHOOK_IP_BLOCKED',
        { ip: requestIp, provider: 'gafiapay' }, requestIp).catch(() => {});
      return false;
    }

    // ─── 2. HMAC Signature Verification ─────────────────────────────────────────
    const bodyForSigning = rawBodyString || (typeof body === 'string' ? body : JSON.stringify(body));
    const secretKey = this.gafiapaySecretKey || '';

    if (secretKey) {
      if (!requestSignature) {
        this.logger.error('SECURITY: Gafiapay webhook rejected — no signature header present');
        await this.auditLogService.log(null, 'webhook@gafiapay.com', 'WEBHOOK_NO_SIGNATURE',
          { provider: 'gafiapay', ip: requestIp }, requestIp).catch(() => {});
        return false;
      }

      const computedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(bodyForSigning)
        .digest('hex');

      this.logger.debug(`Gafiapay Webhook: Signature check — received=${requestSignature?.substring(0, 8)}... computed=${computedSignature.substring(0, 8)}...`);

      // Use timing-safe comparison to prevent timing attacks
      const sigBuffer = Buffer.from(requestSignature || '', 'hex');
      const computedBuffer = Buffer.from(computedSignature, 'hex');
      const sigValid =
        sigBuffer.length === computedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, computedBuffer);

      if (!sigValid) {
        this.logger.error(`SECURITY: Gafiapay webhook REJECTED — HMAC-SHA256 signature mismatch from IP ${requestIp}`);
        await this.auditLogService.log(null, 'webhook@gafiapay.com', 'WEBHOOK_SIG_MISMATCH',
          { provider: 'gafiapay', receivedSig: requestSignature?.substring(0, 16) + '...', ip: requestIp },
          requestIp).catch(() => {});
        return false;
      }
    } else {
      this.logger.warn('Gafiapay webhook: GAFIAPAY_SECRET_KEY not configured — skipping HMAC check (dev mode only)');
    }

    // Extract payment data - try multiple common payload structures
    // Gafiapay may wrap data in body.data.transaction, body.data, body.payload, body.event.data, or send flat
    const transaction = body.data?.transaction || body.payload?.transaction || body.event?.data?.transaction || body.transaction;
    const data = transaction || body.data || body.payload || body.event?.data || body;

    const accountNumber = data.metadata?.virtualAccountNo || data.metadata?.virtual_account_no || data.metadata?.virtualAccountNumber
      || data.accountNumber || data.account_number || data.virtualAccountNumber
      || data.virtual_account_number || data.destinationAccountNumber || data.destination_account_number;
    const amount = data.amount || data.amountPaid || data.amount_paid || data.settlementAmount
      || data.settlement_amount || data.creditAmount || data.credit_amount;
    const reference = data.id || data.orderNo || data.order_no || data.reference || data.txRef || data.tx_ref 
      || data.paymentReference || data.payment_reference || data.transactionReference || data.transaction_reference
      || data.sessionId || data.session_id || data.bankTransferReference;

    console.log('Gafiapay Webhook: Extracted fields -', {
      accountNumber,
      amount,
      reference,
      rawDataKeys: Object.keys(data),
      rawBodyKeys: Object.keys(body),
    });

    if (!accountNumber || !amount || !reference) {
      console.warn('Gafiapay Webhook rejected: missing required payment details in payload.', {
        accountNumber: !!accountNumber,
        amount: !!amount,
        reference: !!reference,
        fullBody: JSON.stringify(body),
      });
      return false;
    }

    const account = await this.gafiapayRepo.findOne({
      where: { accountNumber, isActive: true },
    });
    if (!account) {
      console.warn(`Gafiapay Webhook: No active virtual account found for account number ${accountNumber}`);
      return true;
    }

    console.log(`Gafiapay Webhook: Found account for user ${account.userId}`);

    const existingTx = await this.transactionRepo.findOne({
      where: { reference },
    });
    if (existingTx) {
      console.log(`Gafiapay Webhook: Transaction ${reference} already processed.`);
      return true;
    }

    try {
      const creditAmount = parseFloat(amount);
      if (isNaN(creditAmount) || creditAmount <= 0) {
        this.logger.warn(`Gafiapay Webhook: Invalid amount "${amount}" - skipping`);
        return false;
      }

      // ─── 3. Deposit Velocity / Amount Limits ─────────────────────────────────
      await this.assertDepositLimits(account.userId, creditAmount);

      await this.walletService.deposit(account.userId, creditAmount, 'Gafiapay Bank Transfer', reference);
      this.logger.log(`Gafiapay Webhook: Credited user ${account.userId} ₦${creditAmount} (ref: ${reference})`);
      return true;
    } catch (err: any) {
      this.logger.error(`Gafiapay Webhook deposit failed for user ${account.userId}: ${err.message}`);
      return false;
    }
  }
}

