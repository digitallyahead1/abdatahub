import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class DanmalamaService {
  private readonly logger = new Logger(DanmalamaService.name);
  private client: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseUrl =
      this.configService.get<string>('DANMALAMA_BASE_URL') ||
      process.env.DANMALAMA_BASE_URL ||
      'https://www.danmalama.com.ng/api/v1';
    const apiKey =
      this.configService.get<string>('DANMALAMA_API_KEY') ||
      process.env.DANMALAMA_API_KEY ||
      'vtu_33645c4ea8852f781fd1878b058f4421aa60c4732e1d30f6';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 35000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
    });
  }

  /**
   * Fetch all data plans available on Danmalama across all networks
   */
  async getDataPlans(): Promise<any> {
    try {
      this.logger.log('Fetching Danmalama data plans from /data-plans...');
      const response = await this.client.get('/data-plans');
      this.logger.log(`Fetched Danmalama plans [HTTP ${response.status}]`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to fetch Danmalama data plans:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Format network string to Danmalama standard ('MTN', 'AIRTEL', 'GLO', '9MOBILE')
   */
  formatNetwork(network: string): string {
    const lower = (network || '').toLowerCase().trim();
    if (lower.includes('mtn')) return 'MTN';
    if (lower.includes('airtel')) return 'AIRTEL';
    if (lower.includes('glo')) return 'GLO';
    if (lower.includes('9mobile') || lower.includes('etisalat')) return '9MOBILE';
    return (network || '').toUpperCase().trim();
  }

  /**
   * Execute data bundle purchase on Danmalama
   */
  async purchaseData(
    network: string,
    phone: string,
    planId: number | string,
    requestId?: string,
  ): Promise<any> {
    try {
      const networkUpper = this.formatNetwork(network);
      const planIdStr = String(planId).trim();

      const payload = {
        network: networkUpper,
        phone: phone.trim(),
        planId: planIdStr,
      };

      this.logger.log(`Initiating Danmalama Data Purchase: ${JSON.stringify(payload)} (internalRef=${requestId || 'N/A'})`);
      const response = await this.client.post('/purchase', payload);
      this.logger.log(`Danmalama Data Purchase Response [HTTP ${response.status}]: ${JSON.stringify(response.data)}`);

      const data = response.data;
      const statusStr = String(data?.status || '').toLowerCase();
      const isSuccess =
        statusStr === 'true' ||
        data?.status === true ||
        statusStr === 'success' ||
        statusStr === 'successful';

      if (isSuccess) {
        return {
          status: true,
          current_status: 'success',
          data: data?.data || data,
          reference: data?.data?.reference || `DAN_${Date.now()}`,
          msg: data?.message || 'Data Purchase Successful',
        };
      } else {
        const failMsg =
          data?.message ||
          data?.error ||
          data?.response ||
          'Danmalama returned a failed status';

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
      this.logger.error('Danmalama data purchase failure:', errorMsg);

      let parsedMsg = 'Network error or provider failure';
      if (typeof error.response?.data === 'string') {
        parsedMsg = error.response.data;
      } else if (error.response?.data?.message) {
        parsedMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        parsedMsg = typeof error.response.data.error === 'string'
          ? error.response.data.error
          : JSON.stringify(error.response.data.error);
      } else if (error.message) {
        parsedMsg = error.message;
      }

      return {
        status: false,
        current_status: 'failed',
        msg: parsedMsg,
        error: errorMsg,
        isTransientError:
          !error.response ||
          error.response.status >= 500 ||
          error.code === 'ECONNABORTED' ||
          error.message?.includes('timeout'),
      };
    }
  }
}
