import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class SwiftbillsService {
  private readonly logger = new Logger(SwiftbillsService.name);
  private client: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseUrl = this.configService.get<string>('SWIFTBILLS_BASE_URL') || 'https://swiftbills.com.ng/api';
    const apiKey = this.configService.get<string>('SWIFTBILLS_API_KEY');

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 35000, // 35 seconds timeout
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
    });
  }

  async getBalance(): Promise<number> {
    try {
      const response = await this.client.get('/user');
      if (response.data && response.data.wallet !== undefined) {
        return parseFloat(response.data.wallet);
      }
      if (response.data?.user?.wallet !== undefined) {
        return parseFloat(response.data.user.wallet);
      }
      return 0;
    } catch (error: any) {
      this.logger.error('Failed to fetch Swiftbills balance:', error.response?.data || error.message);
      return 0;
    }
  }

  async getDataPlans(): Promise<any[]> {
    try {
      this.logger.log('Fetching Swiftbills data plans...');
      const response = await this.client.get('/data_plans');
      this.logger.log(`Fetched ${Array.isArray(response.data) ? response.data.length : 'non-array'} plans from Swiftbills`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      this.logger.error('Failed to fetch Swiftbills data plans:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Helper to map network string (e.g. 'mtn', 'airtel', 'glo', '9mobile') to Swiftbills network ID (1, 2, 3, 4)
   */
  getNetworkId(network: string): number {
    const lower = (network || '').toLowerCase().trim();
    if (lower.includes('mtn')) return 1;
    if (lower.includes('airtel')) return 2;
    if (lower.includes('glo')) return 3;
    if (lower.includes('9mobile') || lower.includes('etisalat')) return 4;
    return 1;
  }

  async purchaseData(
    network: number | string,
    phone: string,
    planId: number | string,
    requestId?: string,
  ): Promise<any> {
    try {
      const networkId = typeof network === 'number' ? network : this.getNetworkId(network);
      const planIdNum = typeof planId === 'number' ? planId : parseInt(planId, 10);
      const reqId = requestId || `SWIFT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const payload = {
        network: networkId,
        phone,
        bypass: false,
        'request-id': reqId,
        data_plan: planIdNum,
      };

      this.logger.log(`Initiating Swiftbills Data Purchase: ${JSON.stringify(payload)}`);
      const response = await this.client.post('/data', payload);
      this.logger.log(`Swiftbills Data Purchase Response [HTTP ${response.status}]: ${JSON.stringify(response.data)}`);

      const data = response.data;
      const statusStr = String(data?.status || '').toLowerCase();
      const isSuccess =
        statusStr === 'success' ||
        statusStr === 'successful' ||
        statusStr === 'true' ||
        data?.status === true;

      if (isSuccess) {
        return {
          status: true,
          current_status: 'success',
          data,
          msg: data?.message || data?.response || 'Data Purchase Successful',
        };
      } else {
        const failMsg = data?.message || data?.response || data?.error || 'Swiftbills returned a failed status';
        return {
          status: false,
          current_status: 'failed',
          data,
          msg: failMsg,
          isTransientError: false,
        };
      }
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      this.logger.error('Swiftbills data purchase failure:', errorMsg);

      let parsedMsg = 'Network error or provider failure';
      if (typeof error.response?.data === 'string') {
        parsedMsg = error.response.data;
      } else if (error.response?.data?.message) {
        parsedMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        parsedMsg = typeof error.response.data.error === 'string' ? error.response.data.error : JSON.stringify(error.response.data.error);
      } else if (error.message) {
        parsedMsg = error.message;
      }

      return {
        status: false,
        current_status: 'failed',
        msg: parsedMsg,
        error: errorMsg,
        isTransientError: !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
      };
    }
  }
}
