import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class DanmalamaService {
  private readonly logger = new Logger(DanmalamaService.name);
  private client: AxiosInstance;
  private readonly pin: string;

  constructor(private configService: ConfigService) {
    const baseUrl =
      this.configService.get<string>('DANMALAMA_BASE_URL') ||
      process.env.DANMALAMA_BASE_URL ||
      'https://api.danmalama.com.ng/api';

    const apiKey =
      this.configService.get<string>('DANMALAMA_API_KEY') ||
      process.env.DANMALAMA_API_KEY ||
      '';

    this.pin =
      this.configService.get<string>('DANMALAMA_PIN') ||
      process.env.DANMALAMA_PIN ||
      '';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 35000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
    });
  }

  /**
   * Fetch all data plans available on Danmalama across all networks.
   * New endpoint: GET /vending/data/plans
   * Response: { success: true, data: [{ planId, network, label, price }] }
   */
  async getDataPlans(): Promise<any> {
    try {
      this.logger.log('Fetching Danmalama data plans from /vending/data/plans...');
      const response = await this.client.get('/vending/data/plans');
      this.logger.log(`Fetched Danmalama plans [HTTP ${response.status}]`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch Danmalama data plans:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * Format network string to Danmalama standard ('MTN' | 'AIRTEL' | 'GLO' | '9MOBILE')
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
   * Execute a data bundle purchase on Danmalama.
   * New endpoint: POST /vending/data
   * Payload: { network, phone, planId, pin }
   * Response: { success: true, data: { balance, transaction: { _id, reference, status, ... } } }
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

      const payload: Record<string, any> = {
        network: networkUpper,
        phone: phone.trim(),
        planId: planIdStr,
        pin: this.pin,
      };

      this.logger.log(
        `Initiating Danmalama Data Purchase: network=${networkUpper} phone=${phone.trim()} planId=${planIdStr} (internalRef=${requestId || 'N/A'})`,
      );

      const response = await this.client.post('/vending/data', payload);
      this.logger.log(
        `Danmalama Data Purchase Response [HTTP ${response.status}]: ${JSON.stringify(response.data)}`,
      );

      const data = response.data;

      // New API uses { success: true/false } at the top level
      if (data?.success === true) {
        const tx = data?.data?.transaction || {};
        return {
          status: true,
          current_status: 'success',
          data: data.data,
          reference: tx.reference || `DAN_${Date.now()}`,
          msg: 'Data Purchase Successful',
        };
      } else {
        // { success: false, error: { code, message } }
        const failMsg =
          data?.error?.message ||
          data?.error?.code ||
          data?.message ||
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
      const errorPayload = error.response?.data;
      this.logger.error('Danmalama data purchase failure:', errorPayload || error.message);

      let parsedMsg = 'Network error or provider failure';
      if (errorPayload?.error?.message) {
        parsedMsg = errorPayload.error.message;
      } else if (errorPayload?.error?.code) {
        parsedMsg = errorPayload.error.code;
      } else if (typeof errorPayload?.message === 'string') {
        parsedMsg = errorPayload.message;
      } else if (typeof errorPayload === 'string') {
        parsedMsg = errorPayload;
      } else if (error.message) {
        parsedMsg = error.message;
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
