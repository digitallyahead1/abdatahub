import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as http from 'http';
import * as https from 'https';

export interface MaitamaPlanItem {
  id: number;
  network: string;
  networkId: number;
  planType: string;
  name: string;
  size: number | string;
  volume: string;
  validity: string;
  cost: number;
  active: boolean;
}

@Injectable()
export class MaitamaService {
  private readonly logger = new Logger(MaitamaService.name);
  private client: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseUrl =
      this.configService.get<string>('MAITAMA_BASE_URL') ||
      process.env.MAITAMA_BASE_URL ||
      'https://app.maitamadatahub.com/api';

    const apiKey =
      this.configService.get<string>('MAITAMA_API_KEY') ||
      this.configService.get<string>('MAITAMA_API_TOKEN') ||
      process.env.MAITAMA_API_KEY ||
      process.env.MAITAMA_API_TOKEN ||
      '';

    this.client = axios.create({
      baseURL: baseUrl.replace(/\/+$/, ''),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 35000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
    });
  }

  /**
   * Fetch current wallet balance and user details from Maitama Data Hub API.
   * Endpoint: GET /user
   */
  async getBalance(): Promise<number> {
    try {
      const response = await this.client.get('/user');
      const data = response.data;
      if (data?.wallet?.balance !== undefined) {
        return parseFloat(String(data.wallet.balance).replace(/,/g, '')) || 0;
      }
      if (data?.wallet?.account_balance !== undefined) {
        return parseFloat(String(data.wallet.account_balance).replace(/,/g, '')) || 0;
      }
      return 0;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch Maitama Data Hub balance:',
        error.response?.data || error.message,
      );
      return 0;
    }
  }

  /**
   * Fetch full user profile details including funding virtual accounts.
   * Endpoint: GET /user
   */
  async getUserProfile(): Promise<any> {
    try {
      const response = await this.client.get('/user');
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch Maitama Data Hub user profile:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * Fetch and parse all available data plans from Maitama Data Hub.
   * Endpoint: GET /data_plans
   */
  async getDataPlans(): Promise<MaitamaPlanItem[]> {
    try {
      this.logger.log('Fetching Maitama Data Hub data plans from /data_plans...');
      const response = await this.client.get('/data_plans');
      const data = response.data;

      const plans: MaitamaPlanItem[] = [];

      // Structure has `data_plan_types` with nested `data_plans`
      if (Array.isArray(data?.data_plan_types)) {
        for (const planType of data.data_plan_types) {
          if (Array.isArray(planType.data_plans)) {
            for (const p of planType.data_plans) {
              const rawCost = p.api_amount ?? p.user_amount ?? p.amount ?? 0;
              const cost = typeof rawCost === 'number' ? rawCost : parseFloat(String(rawCost).replace(/,/g, '')) || 0;
              const networkName = (p.network || '').toUpperCase();
              const size = p.plan_size ?? p.size ?? '';
              const volume = (p.plan_volume ?? p.volume ?? 'GB').toUpperCase();
              const typeName = p.plan_type || planType.name || '';
              const validity = p.plan_validity ?? p.validity ?? '30 Days';

              // Standardized bundle label e.g., 'MTN 5GB SME Monthly'
              const bundleName = `${networkName} ${size}${volume} ${typeName} ${validity}`.replace(/\s+/g, ' ').trim();

              plans.push({
                id: Number(p.id),
                network: networkName.toLowerCase(),
                networkId: Number(p.network_id || this.formatNetwork(networkName)),
                planType: typeName,
                name: bundleName,
                size,
                volume,
                validity,
                cost,
                active: p.active === 1 || p.active === true,
              });
            }
          }
        }
      }

      this.logger.log(`Fetched and parsed ${plans.length} plans from Maitama Data Hub API`);
      return plans;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch Maitama Data Hub data plans:',
        error.response?.data || error.message,
      );
      return [];
    }
  }

  /**
   * Format network representation to Maitama/SmartTeck network ID integer:
   * 1 = MTN, 2 = Glo, 3 = 9mobile, 4 = Airtel
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
   * Execute a data bundle purchase on Maitama Data Hub.
   * Endpoint: POST /data/{ref} (or POST /data)
   * Headers: Bearer <API_TOKEN>
   * Payload: { plan: <number>, mobile_number: <string>, network: <number> }
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
      
      // Clean phone number (strip whitespace, symbols)
      let cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('234') && cleanPhone.length === 13) {
        cleanPhone = '0' + cleanPhone.slice(3);
      }

      const payload = {
        plan: planIdNum,
        mobile_number: cleanPhone,
        network: networkId,
      };

      // SmartTeck VTU API supports appending reference for idempotency: POST /api/data/{ref}
      const endpoint = requestId ? `/data/${encodeURIComponent(requestId)}` : '/data';

      this.logger.log(
        `Initiating Maitama Data Purchase: endpoint=${endpoint} network=${networkId} phone=${cleanPhone} planId=${planIdNum} (requestId=${requestId || 'N/A'})`,
      );

      const response = await this.client.post(endpoint, payload);
      this.logger.log(
        `Maitama Data Purchase Response [HTTP ${response.status}]: ${JSON.stringify(response.data)}`,
      );

      const resBody = response.data;
      const dataObj = resBody?.data || {};
      const statusStr = String(dataObj.Status || resBody.status || '').toLowerCase();

      // Check if successful or pending
      const isSuccess = statusStr === 'successful' || statusStr === 'success' || statusStr === 'true';
      const isPending = statusStr === 'pending' || statusStr === 'processing';

      if (isSuccess || isPending) {
        return {
          status: true,
          current_status: isPending ? 'processing' : 'success',
          data: dataObj,
          reference: dataObj.ident || requestId || `MTM_${Date.now()}`,
          providerTransactionId: dataObj.id,
          balanceBefore: dataObj.balance_before,
          balanceAfter: dataObj.balance_after,
          msg: dataObj.api_response || 'Data Purchase Successful',
        };
      } else {
        const failMsg =
          dataObj.api_response ||
          dataObj.description ||
          resBody.message ||
          'Maitama Data Hub returned a failed status';

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
        `Maitama data purchase failure [HTTP ${status || 'N/A'}]:`,
        errorPayload || error.message,
      );

      let parsedMsg = 'Network error or provider failure';

      // 1. Check if error payload is a Failed Transaction object (e.g., HTTP 422 with data object)
      if (errorPayload?.data?.api_response) {
        parsedMsg = errorPayload.data.api_response;
      } else if (errorPayload?.data?.description) {
        parsedMsg = errorPayload.data.description;
      } else if (errorPayload?.errors) {
        // Validation or business logic errors (e.g., errors: { status: ['Insufficient wallet balance!'] })
        const errorKeys = Object.keys(errorPayload.errors);
        if (errorKeys.length > 0) {
          const firstKey = errorKeys[0];
          const val = errorPayload.errors[firstKey];
          parsedMsg = Array.isArray(val) ? val.join(' ') : String(val);
        } else if (errorPayload.message) {
          parsedMsg = errorPayload.message;
        }
      } else if (typeof errorPayload?.message === 'string') {
        parsedMsg = errorPayload.message;
      } else if (typeof errorPayload === 'string') {
        parsedMsg = errorPayload;
      } else if (error.message) {
        parsedMsg = error.message;
      }

      // Check for insufficient balance on provider account
      if (parsedMsg.toLowerCase().includes('insufficient') && parsedMsg.toLowerCase().includes('balance')) {
        parsedMsg = 'Provider Gateway Error: Insufficient balance on Maitama Data Hub API wallet. Please contact admin to top up provider API wallet.';
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

