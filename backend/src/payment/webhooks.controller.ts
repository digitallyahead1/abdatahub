import { Controller, Post, Body, Req, HttpCode, HttpStatus, RawBodyRequest } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('monnify')
  @HttpCode(HttpStatus.OK)
  async handleMonnifyWebhook(@Req() req: any, @Body() body: any) {
    const signature = req.headers['monnify-signature'] as string;
    const success = await this.paymentService.processMonnifyWebhook(body, signature);
    
    // We always acknowledge receipt with 200 OK as recommended by Monnify
    return { success };
  }

  @Post('gafiapay')
  @HttpCode(HttpStatus.OK)
  async handleGafiapayWebhook(@Req() req: RawBodyRequest<any>, @Body() body: any) {
    console.log('=== GAFIAPAY WEBHOOK RECEIVED ===');
    console.log('Headers:', JSON.stringify({
      'x-gafiapay-signature': req.headers['x-gafiapay-signature'],
      'x-signature': req.headers['x-signature'],
      'signature': req.headers['signature'],
      'content-type': req.headers['content-type'],
    }));
    console.log('Body:', JSON.stringify(body));

    // Log the webhook to the database for debugging
    try {
      await this.auditLogService.log(
        null,
        'webhook@gafiapay.com',
        'GAFIAPAY_WEBHOOK_RECEIVED',
        {
          headers: {
            'x-gafiapay-signature': req.headers['x-gafiapay-signature'],
            'x-signature': req.headers['x-signature'],
            'signature': req.headers['signature'],
            'content-type': req.headers['content-type'],
          },
          body,
        },
        req.ip,
      );
    } catch (logErr) {
      console.error('Failed to log webhook to audit_log:', logErr);
    }

    const signature = (req.headers['x-gafiapay-signature'] || 
                     req.headers['x-signature'] || 
                     req.headers['signature']) as string;

    // Pass raw body string for accurate signature verification
    const rawBody = req.rawBody ? req.rawBody.toString('utf-8') : undefined;
                     
    const success = await this.paymentService.processGafiapayWebhook(body, signature, rawBody);
    
    console.log('=== GAFIAPAY WEBHOOK RESULT:', success, '===');
    // We always acknowledge receipt with 200 OK as recommended by Gafiapay
    return { success };
  }
}
