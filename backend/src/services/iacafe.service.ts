import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class IacafeService {
  private readonly logger = new Logger(IacafeService.name);
  private client: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseUrl = this.configService.get<string>('IACAFE_BASE_URL') || 'https://iacafe.com.ng/devapi/v1';
    const apiKey = this.configService.get<string>('IACAFE_SECRET_KEY');

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
    });
  }

  async verifyCustomer(customerId: string, serviceId: string, variationId?: string): Promise<any> {
    try {
      const payload: any = {
        customer_id: customerId,
        service_id: serviceId,
      };
      if (variationId) {
        payload.variation_id = variationId;
      }
      this.logger.log(`Initiating IACAFE Customer Verification: ${JSON.stringify(payload)}`);
      const response = await this.client.post('/verify-customer', payload);
      this.logger.log(`IACAFE Customer Verification Response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      this.logger.error('IACAFE customer verification failure:', errorMsg);
      return {
        status: false,
        msg: error.response?.data?.error?.message || error.response?.data?.msg || error.response?.data?.message || error.message,
        error: errorMsg,
      };
    }
  }

  async getVariations(product: string, serviceId: string): Promise<any> {
    try {
      this.logger.log(`Fetching IACAFE Variations: product=${product}, service_id=${serviceId}`);
      const response = await this.client.get('/variations', {
        params: {
          product,
          service_id: serviceId,
        },
      });
      this.logger.log(`IACAFE Variations Response status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      this.logger.error('Failed to fetch IACAFE variations:', errorMsg);
      throw new InternalServerErrorException('Error fetching variations from IACAFE');
    }
  }

  async payElectricity(
    requestId: string,
    customerId: string,
    serviceId: string,
    variationId: string,
    amount: number,
  ): Promise<any> {
    try {
      const payload = {
        request_id: requestId,
        customer_id: customerId,
        service_id: serviceId,
        variation_id: variationId,
        amount,
      };
      this.logger.log(`Initiating IACAFE Electricity Payment: ${JSON.stringify(payload)}`);
      const response = await this.client.post('/electricity', payload);
      this.logger.log(`IACAFE Electricity Payment Response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      this.logger.error('IACAFE electricity payment failure:', errorMsg);
      return {
        status: false,
        msg: error.response?.data?.error?.message || error.response?.data?.msg || error.response?.data?.message || error.message,
        error: errorMsg,
        isTransientError: !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED' || error.message.includes('timeout')
      };
    }
  }

  async payCable(
    requestId: string,
    customerId: string,
    serviceId: string,
    variationId: string,
    amount?: number,
  ): Promise<any> {
    try {
      const payload: any = {
        request_id: requestId,
        customer_id: customerId,
        service_id: serviceId,
        variation_id: variationId,
      };
      if (amount !== undefined) {
        payload.amount = amount;
      }
      this.logger.log(`Initiating IACAFE Cable Payment: ${JSON.stringify(payload)}`);
      const response = await this.client.post('/cable', payload);
      this.logger.log(`IACAFE Cable Payment Response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      this.logger.error('IACAFE cable payment failure:', errorMsg);
      return {
        status: false,
        msg: error.response?.data?.error?.message || error.response?.data?.msg || error.response?.data?.message || error.message,
        error: errorMsg,
        isTransientError: !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED' || error.message.includes('timeout')
      };
    }
  }

  async requeryOrder(requestId: string): Promise<any> {
    try {
      this.logger.log(`Requerying IACAFE order: request_id=${requestId}`);
      const response = await this.client.get('/requery', {
        params: {
          request_id: requestId,
        },
      });
      this.logger.log(`IACAFE Requery Response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      this.logger.error(`IACAFE requery failure for request ${requestId}:`, errorMsg);
      return {
        status: false,
        msg: error.response?.data?.error?.message || error.response?.data?.msg || error.response?.data?.message || error.message,
        error: errorMsg,
      };
    }
  }
}
