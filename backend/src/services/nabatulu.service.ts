import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as http from 'http';
import * as https from 'https';

export interface NabatuluPlanItem {
  id: number;
  network: string;
  networkId: number;
  planType: string;
  name: string;
  size: string | number;
  volume: string;
  validity: string;
  cost: number;
  active: boolean;
}

@Injectable()
export class NabatuluService {
  private readonly logger = new Logger(NabatuluService.name);
  private client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly basicAuth: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('NABATULU_BASE_URL') ||
      process.env.NABATULU_BASE_URL ||
      'https://nabatulusubapi.com/api'
    ).replace(/\/+$/, '');

    this.apiToken =
      this.configService.get<string>('NABATULU_API_TOKEN') ||
      process.env.NABATULU_API_TOKEN ||
      '';

    const username =
      this.configService.get<string>('NABATULU_USERNAME') ||
      process.env.NABATULU_USERNAME ||
      '';
    const password =
      this.configService.get<string>('NABATULU_PASSWORD') ||
      process.env.NABATULU_PASSWORD ||
      '';

    this.basicAuth =
      this.configService.get<string>('NABATULU_BASIC_AUTH') ||
      process.env.NABATULU_BASIC_AUTH ||
      (username && password
        ? Buffer.from(`${username}:${password}`).toString('base64')
        : '');

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Token ${this.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 35000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
    });
  }

  /**
   * Fetch current wallet balance from NabatuluSub API.
   * Uses Basic Auth to call POST /user (which returns balance, username, and token).
   */
  async getBalance(): Promise<number> {
    try {
      if (this.basicAuth) {
        const response = await axios.post(
          `${this.baseUrl}/user`,
          {},
          {
            headers: {
              Authorization: `Basic ${this.basicAuth}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 15000,
          },
        );
        const data = response.data;
        if (data?.balance !== undefined) {
          return parseFloat(String(data.balance).replace(/,/g, '')) || 0;
        }
      }
      return 0;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch NabatuluSub balance:',
        error.response?.data || error.message,
      );
      return 0;
    }
  }

  /**
   * Fetch full user profile including balance.
   */
  async getUserProfile(): Promise<any> {
    try {
      if (this.basicAuth) {
        const response = await axios.post(
          `${this.baseUrl}/user`,
          {},
          {
            headers: {
              Authorization: `Basic ${this.basicAuth}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 15000,
          },
        );
        return response.data;
      }
      return null;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch NabatuluSub user profile:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * Map network name to NabatuluSub network ID integer:
   * 1 = MTN, 2 = Glo, 3 = 9mobile/Etisalat, 4 = Airtel
   */
  formatNetwork(network: string | number): number {
    if (typeof network === 'number') {
      if ([1, 2, 3, 4].includes(network)) return network;
    }
    const lower = String(network || '').toLowerCase().trim();
    if (lower.includes('mtn')) return 1;
    if (lower.includes('glo')) return 2;
    if (lower.includes('9mobile') || lower.includes('etisalat')) return 3;
    if (lower.includes('airtel')) return 4;
    return 1;
  }

  /**
   * Execute a data bundle purchase on NabatuluSub API.
   * Endpoint: POST /data/
   * Headers: Token <API_TOKEN>
   * Payload: { network, phone, data_plan, bypass, "request-id" }
   */
  async purchaseData(
    network: number | string,
    phone: string,
    planId: number | string,
    requestId?: string,
  ): Promise<any> {
    try {
      const networkId = this.formatNetwork(network);
      const planIdNum = parseInt(String(planId).trim(), 10);

      // Clean phone number (strip whitespace, symbols, convert 234 to 0)
      let cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('234') && cleanPhone.length === 13) {
        cleanPhone = '0' + cleanPhone.slice(3);
      }

      const reqId =
        requestId ||
        `NAB_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // NabatuluSub API expects: network, phone, data_plan, bypass, and request-id
      const payload = {
        network: networkId,
        phone: cleanPhone,
        data_plan: planIdNum,
        bypass: false,
        'request-id': reqId,
        // Fallbacks for compatibility
        plan: planIdNum,
        mobile_number: cleanPhone,
        request_id: reqId,
      };

      this.logger.log(
        `Initiating NabatuluSub Data Purchase: network=${networkId} phone=${cleanPhone} data_plan=${planIdNum} reqId=${reqId}`,
      );

      const response = await this.client.post('/data/', payload);
      this.logger.log(
        `NabatuluSub Data Purchase Response [HTTP ${response.status}]: ${JSON.stringify(response.data)}`,
      );

      const resBody = response.data;
      const dataObj =
        resBody && typeof resBody === 'object' && resBody.data && typeof resBody.data === 'object'
          ? resBody.data
          : resBody || {};

      const rawStatus =
        dataObj.Status ??
        dataObj.status ??
        resBody.Status ??
        resBody.status ??
        dataObj.state ??
        resBody.state ??
        '';

      const statusStr = String(rawStatus).toLowerCase().trim();
      const apiResponseStr = String(
        dataObj.api_response || dataObj.message || resBody.message || '',
      ).toLowerCase().trim();

      const isExplicitFail =
        statusStr === 'failed' ||
        statusStr === 'fail' ||
        statusStr === 'failure' ||
        statusStr === 'false' ||
        statusStr === 'error' ||
        rawStatus === false ||
        resBody.success === false;

      const isPending =
        statusStr === 'pending' ||
        statusStr === 'processing' ||
        statusStr === 'queued' ||
        statusStr === 'submitted';

      const isExplicitSuccess =
        statusStr === 'successful' ||
        statusStr === 'success' ||
        statusStr === 'completed' ||
        statusStr === 'done' ||
        statusStr === 'true' ||
        rawStatus === true ||
        resBody.success === true ||
        apiResponseStr === 'success' ||
        apiResponseStr === 'successful';

      // If HTTP 200/201 and has transaction info (ident, id, balance_after), treat as success
      const hasTransactionData = !!(
        dataObj.ident ||
        dataObj.id ||
        dataObj.balance_after ||
        dataObj.create_date ||
        dataObj.transaction_id ||
        dataObj.ref
      );
      const isSuccess =
        isExplicitSuccess ||
        (!isExplicitFail &&
          !isPending &&
          (response.status === 200 || response.status === 201) &&
          hasTransactionData);

      if (isSuccess || isPending) {
        return {
          status: true,
          current_status: isPending ? 'processing' : 'success',
          data: dataObj,
          reference:
            dataObj.ident ||
            dataObj.ref ||
            dataObj.transaction_id ||
            reqId,
          providerTransactionId: dataObj.id || dataObj.transaction_id || null,
          balanceBefore: dataObj.balance_before,
          balanceAfter: dataObj.balance_after,
          msg:
            dataObj.api_response ||
            dataObj.message ||
            dataObj.description ||
            'Data Purchase Successful',
        };
      } else {
        const failMsg =
          dataObj.api_response ||
          dataObj.message ||
          dataObj.description ||
          resBody.message ||
          'NabatuluSub API returned a failed status';

        return {
          status: false,
          current_status: 'failed',
          data: dataObj,
          msg: failMsg,
          isTransientError: false,
        };
      }
    } catch (error: any) {
      const errorPayload = error.response?.data;
      const status = error.response?.status;
      this.logger.error(
        `NabatuluSub data purchase failure [HTTP ${status || 'N/A'}]:`,
        errorPayload || error.message,
      );

      let parsedMsg = 'Network error or provider failure';

      if (errorPayload?.message) {
        parsedMsg = errorPayload.message;
      } else if (errorPayload?.data?.api_response) {
        parsedMsg = errorPayload.data.api_response;
      } else if (errorPayload?.data?.message) {
        parsedMsg = errorPayload.data.message;
      } else if (errorPayload?.errors) {
        const errorKeys = Object.keys(errorPayload.errors);
        if (errorKeys.length > 0) {
          const firstKey = errorKeys[0];
          const val = errorPayload.errors[firstKey];
          parsedMsg = Array.isArray(val) ? val.join(' ') : String(val);
        }
      } else if (typeof errorPayload === 'string') {
        parsedMsg = errorPayload;
      } else if (error.message) {
        parsedMsg = error.message;
      }

      if (
        parsedMsg.toLowerCase().includes('insufficient') &&
        parsedMsg.toLowerCase().includes('wallet')
      ) {
        parsedMsg =
          'Provider Gateway Error: Insufficient balance on NabatuluSub API wallet. Please contact admin to top up provider API wallet.';
      }

      return {
        status: false,
        current_status: 'failed',
        msg: parsedMsg,
        error: errorPayload || error.message,
        isTransientError:
          !error.response ||
          error.response.status >= 500 ||
          error.code === 'ECONNABORTED' ||
          error.message?.includes('timeout'),
      };
    }
  }
}
