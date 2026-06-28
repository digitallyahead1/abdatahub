import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class SmePlugService {
  private readonly logger = new Logger(SmePlugService.name);
  private client: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseUrl = this.configService.get<string>('SMEPLUG_BASE_URL') || 'https://smeplug.ng/api/v1';
    const apiKey = this.configService.get<string>('SMEPLUG_SECRET_KEY');

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
  }

  async getBalance(): Promise<number> {
    try {
      const response = await this.client.get('/account/balance');
      if (response.data && response.data.balance !== undefined) {
        return parseFloat(response.data.balance);
      }
      return 0;
    } catch (error: any) {
      this.logger.error('Failed to fetch SMEPlug balance:', error.response?.data || error.message);
      throw new InternalServerErrorException('Error contacting SMEPlug service');
    }
  }

  async getNetworks(): Promise<any> {
    try {
      const response = await this.client.get('/networks');
      if (response.data && response.data.status === true) {
        return response.data.networks;
      }
      throw new Error(response.data?.msg || 'Network list retrieval failed');
    } catch (error: any) {
      this.logger.error('Failed to fetch SMEPlug networks:', error.response?.data || error.message);
      throw new InternalServerErrorException('Error fetching networks from SMEPlug');
    }
  }

  async getDataPlans(): Promise<any> {
    try {
      const response = await this.client.get('/data/plans');
      if (response.data && response.data.status === true) {
        return response.data.data;
      }
      throw new Error(response.data?.msg || 'Data plans retrieval failed');
    } catch (error: any) {
      this.logger.error('Failed to fetch SMEPlug data plans:', error.response?.data || error.message);
      throw new InternalServerErrorException('Error fetching data plans from SMEPlug');
    }
  }

  async purchaseData(
    networkId: number,
    planId: number,
    phone: string,
    customerReference: string,
  ): Promise<any> {
    try {
      const payload = {
        network_id: networkId,
        plan_id: planId,
        phone,
        customer_reference: customerReference,
      };
      
      this.logger.log(`Initiating SMEPlug Data Purchase: ${JSON.stringify(payload)}`);
      const response = await this.client.post('/data/purchase', payload);
      this.logger.log(`SMEPlug Data Purchase Response: ${JSON.stringify(response.data)}`);
      
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      this.logger.error('SMEPlug data purchase failure:', errorMsg);
      return {
        status: false,
        msg: error.response?.data?.msg || error.response?.data?.message || error.message,
        error: errorMsg,
      };
    }
  }

  async purchaseAirtime(
    networkId: number,
    phone: string,
    amount: number,
    customerReference: string,
  ): Promise<any> {
    try {
      const payload = {
        network_id: networkId,
        phone,
        amount,
        customer_reference: customerReference,
      };

      this.logger.log(`Initiating SMEPlug Airtime Purchase: ${JSON.stringify(payload)}`);
      const response = await this.client.post('/airtime/purchase', payload);
      this.logger.log(`SMEPlug Airtime Purchase Response: ${JSON.stringify(response.data)}`);

      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      this.logger.error('SMEPlug airtime purchase failure:', errorMsg);
      return {
        status: false,
        msg: error.response?.data?.msg || error.response?.data?.message || error.message,
        error: errorMsg,
      };
    }
  }
}
