import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class EmailService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly templateId: string;
  private readonly configId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {
    this.baseUrl = this.configService.get<string>('TERMII_BASE_URL') || 'https://v3.api.termii.com';
    this.apiKey = this.configService.get<string>('TERMII_API_KEY') || '';
    this.templateId = this.configService.get<string>('TERMII_TEMPLATE_ID') || '';
    this.configId = this.configService.get<string>('TERMII_CONFIG_ID') || '';
  }

  async sendWelcomeEmail(fullName: string, email: string, password: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/templates/send-email`;
      const payload = {
        api_key: this.apiKey,
        email: email,
        subject: 'Welcome to AB Data Hub!',
        email_configuration_id: this.configId,
        template_id: this.templateId,
        variables: {
          fullName,
          email,
          password,
        },
      };

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log(`Welcome email response for ${email}:`, response.data);
      await this.auditLogService.log(null, email, 'welcome_email_success', {
        response: response.data,
      });
      return true;
    } catch (error: any) {
      const errMsg = error.response?.data || error.message;
      console.error(`Failed to send welcome email to ${email}:`, errMsg);
      await this.auditLogService.log(null, email, 'welcome_email_failure', {
        error: errMsg,
      });
      return false;
    }
  }

  async sendOtpEmail(email: string, code: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/email/otp/send`;
      const payload = {
        api_key: this.apiKey,
        email_address: email,
        code,
        email_configuration_id: this.configId,
      };

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log(`OTP email response for ${email}:`, response.data);
      await this.auditLogService.log(null, email, 'forgot_password_otp_sent', {
        response: response.data,
      });
      return true;
    } catch (error: any) {
      const errMsg = error.response?.data || error.message;
      console.error(`Failed to send OTP email to ${email}:`, errMsg);
      await this.auditLogService.log(null, email, 'forgot_password_otp_failed', {
        error: errMsg,
      });
      return false;
    }
  }
}
