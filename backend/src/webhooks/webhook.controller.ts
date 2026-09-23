import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1/webhooks')
@UseGuards(JwtAuthGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * POST /v1/webhooks
   * Register a new webhook endpoint.
   */
  @Post()
  async register(@Req() req: any, @Body() body: any) {
    const data = await this.webhookService.register(req.user.id, body);
    return {
      success: true,
      data,
      message: 'Webhook endpoint registered. Save your secret — it will not be shown again.',
    };
  }

  /**
   * GET /v1/webhooks
   * List all webhook endpoints for the current user.
   */
  @Get()
  async list(@Req() req: any) {
    const data = await this.webhookService.list(req.user.id);
    return { success: true, data, message: 'Webhook endpoints retrieved successfully.' };
  }

  /**
   * DELETE /v1/webhooks/:id
   * Permanently delete a webhook endpoint.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.webhookService.delete(req.user.id, id);
    return { success: true, data: null, message: 'Webhook endpoint deleted.' };
  }

  /**
   * POST /v1/webhooks/:id/disable
   * Disable a webhook endpoint without deleting it.
   */
  @Post(':id/disable')
  async disable(@Req() req: any, @Param('id') id: string) {
    const data = await this.webhookService.disable(req.user.id, id);
    return { success: true, data, message: 'Webhook endpoint disabled.' };
  }

  /**
   * GET /v1/webhooks/:id/deliveries
   * View recent delivery attempts for a webhook endpoint.
   */
  @Get(':id/deliveries')
  async deliveries(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.webhookService.listDeliveries(
      req.user.id,
      id,
      limit ? parseInt(limit, 10) : 50,
    );
    return { success: true, data, message: 'Webhook deliveries retrieved.' };
  }

  /**
   * POST /v1/webhooks/:id/test
   * Send a test ping to the registered URL to verify it's reachable.
   */
  @Post(':id/test')
  async test(@Req() req: any, @Param('id') id: string) {
    const data = await this.webhookService.sendTestPing(req.user.id, id);
    return {
      success: data.success,
      data,
      message: data.message,
    };
  }
}
