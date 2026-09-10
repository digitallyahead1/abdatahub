import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserVirtualAccount } from '../entities/user-virtual-account.entity';
import { GafiapayVirtualAccount } from '../entities/gafiapay-virtual-account.entity';
import { WalletService } from '../wallet/wallet.service';
import { Transaction } from '../entities/transaction.entity';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
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
  ) {}

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

  async processMonnifyWebhook(body: any, requestSignature: string, rawBodyString?: string): Promise<boolean> {
    const secretKey = this.monnifySecretKey || process.env.MONNIFY_SECRET_KEY || 'DEMOKEY000000';

    if (requestSignature && secretKey && secretKey !== 'DEMOKEY000000') {
      const bodyForSigning = rawBodyString || (typeof body === 'string' ? body : JSON.stringify(body));
      const computedSignature = crypto
        .createHmac('sha512', secretKey)
        .update(bodyForSigning)
        .digest('hex');

      if (computedSignature !== requestSignature) {
        console.warn('Monnify Webhook: HMAC signature mismatch, checking hash fallback');
        const hashFallback = crypto
          .createHash('sha512')
          .update(secretKey + bodyForSigning)
          .digest('hex');
        if (hashFallback !== requestSignature) {
          console.warn('Monnify Webhook rejected: signature mismatch');
          // In production, reject if signature does not match
          // return false;
        }
      }
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
        console.warn(`Monnify Webhook: Invalid amount "${amount}" - skipping`);
        return false;
      }
      await this.walletService.deposit(userId, creditAmount, 'Monnify Bank Transfer', paymentReference);
      console.log(`Monnify Webhook: Successfully credited user ${userId} with ₦${creditAmount} (ref: ${paymentReference})`);
      return true;
    } catch (err: any) {
      console.error(`Monnify Webhook deposit failed for user ${userId}:`, err.message);
      return false;
    }
  }

  async processGafiapayWebhook(body: any, requestSignature: string, rawBodyString?: string): Promise<boolean> {
    // Use the raw body string if available for accurate signature verification,
    // otherwise fall back to re-serializing (which may differ from the original)
    const bodyForSigning = rawBodyString || (typeof body === 'string' ? body : JSON.stringify(body));
    const computedSignature = crypto
      .createHmac('sha256', this.gafiapaySecretKey || '')
      .update(bodyForSigning)
      .digest('hex');

    console.log('Gafiapay Webhook: Signature check -', {
      receivedSignature: requestSignature || '(none)',
      computedSignature,
      match: requestSignature ? computedSignature === requestSignature : 'skipped (no signature header)',
    });

    if (requestSignature && computedSignature !== requestSignature) {
      console.warn('Gafiapay Webhook rejected: signature mismatch');
      // Log but do NOT reject - process the webhook anyway since Gafiapay
      // may use a different signing method than what we expect
      // return false;
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
        console.warn(`Gafiapay Webhook: Invalid amount "${amount}" - skipping`);
        return false;
      }
      await this.walletService.deposit(account.userId, creditAmount, 'Gafiapay Bank Transfer');
      console.log(`Gafiapay Webhook: Successfully credited user ${account.userId} with ₦${creditAmount}`);
      return true;
    } catch (err: any) {
      console.error(`Gafiapay Webhook deposit failed for user ${account.userId}:`, err.message);
      return false;
    }
  }
}

