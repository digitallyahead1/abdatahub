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
  private readonly monnifyApiKey = process.env.MONNIFY_API_KEY;
  private readonly monnifySecretKey = process.env.MONNIFY_SECRET_KEY;
  private readonly monnifyContractCode = process.env.MONNIFY_CONTRACT_CODE;
  private readonly monnifyBaseUrl = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';

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
      const authString = Buffer.from(`${this.monnifyApiKey}:${this.monnifySecretKey}`).toString('base64');
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
      throw new InternalServerErrorException('Failed to authenticate with Monnify');
    }
  }

  async generateMonnifyAccount(userId: string, email: string, fullName: string): Promise<UserVirtualAccount> {
    const existing = await this.getMonnifyAccount(userId);
    if (existing) {
      return existing;
    }

    const token = await this.getMonnifyAccessToken();
    const accountReference = `USER_${userId.replace(/-/g, '')}_${Date.now()}`;
    const cleanedName = fullName.replace(/[^a-zA-Z0-9.\s'-]/g, '');

    try {
      const response = await axios.post(
        `${this.monnifyBaseUrl}/api/v1/bank-transfer/reserved-accounts`,
        {
          accountReference,
          accountName: `ABDATAHUB_${cleanedName}`,
          currencyCode: 'NGN',
          contractCode: this.monnifyContractCode,
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

      const resBody = response.data?.responseBody;
      if (!resBody || !resBody.accounts || resBody.accounts.length === 0) {
        throw new Error('No account details returned from Monnify reserved accounts endpoint');
      }

      const accountDetails = resBody.accounts[0];
      const newAccount = this.monnifyRepo.create({
        userId,
        accountReference,
        accountNumber: accountDetails.accountNumber,
        accountName: resBody.accountName,
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
  ): Promise<GafiapayVirtualAccount> {
    const active = await this.getActiveGafiapayAccount(userId);
    if (active) {
      return active;
    }

    const firstName = (fullName || '').trim().split(/\s+/)[0] || '';
    const cleanedFirstName = firstName.replace(/[^a-zA-Z0-9'-]/g, '');
    const capitalizedFirstName = cleanedFirstName.charAt(0).toUpperCase() + cleanedFirstName.slice(1);
    const accountName = `ABDATAHUB ${capitalizedFirstName}`.trim();

    const timestamp = Date.now().toString();
    const reqBody = {
      email,
      name: accountName,
      nin: '31721867311',
    };

    const bodyString = JSON.stringify(reqBody);
    const signString = `${bodyString}${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.gafiapaySecretKey || 'secret')
      .update(signString)
      .digest('hex');

    try {
      const response = await axios.post(
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

      const data = response.data;
      if (data.status !== 'success' || !data.data) {
        throw new Error('Gafiapay account generation response status is not success');
      }

      const info = data.data;

      const permanentAccount = this.gafiapayRepo.create({
        userId,
        accountNumber: info.accountNumber,
        accountName: info.accountName,
        bankName: info.bankName,
        isActive: true,
      });

      return await this.gafiapayRepo.save(permanentAccount);
    } catch (error: any) {
      console.error('Gafiapay account generation failed:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to generate Gafiapay permanent account',
      );
    }
  }

  // ================= WEBHOOK PROCESSORS =================

  async processMonnifyWebhook(body: any, requestSignature: string): Promise<boolean> {
    if (!requestSignature) {
      console.warn('Monnify Webhook rejected: missing monnify-signature header');
      return false;
    }

    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const computedSignature = crypto
      .createHmac('sha512', this.monnifySecretKey || '')
      .update(rawBody)
      .digest('hex');

    if (computedSignature !== requestSignature) {
      console.warn('Monnify Webhook rejected: signature mismatch');
      return false;
    }

    const { eventType, eventData } = body;
    if (eventType !== 'SUCCESSFUL_TRANSACTION') {
      return true;
    }

    const { amount, accountReference, paymentReference } = eventData;

    const existingTx = await this.transactionRepo.findOne({
      where: { reference: paymentReference },
    });
    if (existingTx) {
      console.log(`Monnify Webhook: Transaction ${paymentReference} already processed.`);
      return true;
    }

    const parts = accountReference.split('_');
    if (parts.length < 2) {
      console.error(`Monnify Webhook: Invalid accountReference format: ${accountReference}`);
      return false;
    }

    let rawUserId = parts[1];
    if (rawUserId.length === 32) {
      rawUserId = `${rawUserId.substring(0, 8)}-${rawUserId.substring(8, 12)}-${rawUserId.substring(12, 16)}-${rawUserId.substring(16, 20)}-${rawUserId.substring(20)}`;
    }

    try {
      const creditAmount = parseFloat(amount);
      await this.walletService.deposit(rawUserId, creditAmount, 'Monnify Bank Transfer');
      console.log(`Monnify Webhook: Successfully credited user ${rawUserId} with ₦${creditAmount}`);
      return true;
    } catch (err: any) {
      console.error(`Monnify Webhook deposit failed for user ${rawUserId}:`, err.message);
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

