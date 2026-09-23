import { Injectable, Logger, NotFoundException, BadRequestException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEndpoint, WEBHOOK_EVENTS } from '../entities/webhook-endpoint.entity';
import { WebhookDelivery } from '../entities/webhook-delivery.entity';
import * as crypto from 'crypto';
import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 3000, 9000]; // exponential backoff

@Injectable()
export class WebhookService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookEndpoint)
    private endpointRepo: Repository<WebhookEndpoint>,
    @InjectRepository(WebhookDelivery)
    private deliveryRepo: Repository<WebhookDelivery>,
  ) {}

  // ─── Bootstrap: create tables if they don't exist ────────────────────────

  async onApplicationBootstrap() {
    try {
      const manager = this.endpointRepo.manager;

      await manager.query(`
        CREATE TABLE IF NOT EXISTS "webhook_endpoint" (
          "id"        uuid NOT NULL DEFAULT gen_random_uuid(),
          "userId"    uuid NOT NULL,
          "apiKeyId"  uuid,
          "label"     character varying NOT NULL DEFAULT 'My Webhook',
          "url"       character varying NOT NULL,
          "secret"    character varying NOT NULL,
          "events"    text[] NOT NULL DEFAULT ARRAY['data.purchase.success','data.purchase.failed'],
          "status"    character varying NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_webhook_endpoint_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_webhook_endpoint_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "IDX_webhook_endpoint_userId" ON "webhook_endpoint" ("userId");
      `);

      await manager.query(`
        CREATE TABLE IF NOT EXISTS "webhook_delivery" (
          "id"                  uuid NOT NULL DEFAULT gen_random_uuid(),
          "webhookEndpointId"   uuid NOT NULL,
          "event"               character varying NOT NULL,
          "payload"             jsonb NOT NULL,
          "responseStatus"      integer,
          "responseBody"        character varying,
          "attempt"             integer NOT NULL DEFAULT 1,
          "success"             boolean NOT NULL DEFAULT false,
          "deliveredAt"         TIMESTAMP,
          "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_webhook_delivery_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_webhook_delivery_endpoint"
            FOREIGN KEY ("webhookEndpointId") REFERENCES "webhook_endpoint"("id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_endpointId" ON "webhook_delivery" ("webhookEndpointId", "createdAt" DESC);
      `);

      this.logger.log('Webhook tables verified.');
    } catch (err: any) {
      this.logger.error('Failed to auto-verify webhook tables:', err.message);
    }
  }

  // ─── Registration ─────────────────────────────────────────────────────────

  async register(
    userId: string,
    body: { label?: string; url: string; events?: string[]; apiKeyId?: string },
  ) {
    // Validate URL
    try {
      new URL(body.url);
    } catch {
      throw new BadRequestException('Invalid webhook URL. Must be a valid https:// URL.');
    }
    if (!body.url.startsWith('https://')) {
      throw new BadRequestException('Webhook URL must use HTTPS.');
    }

    // Validate events
    const events = body.events && body.events.length > 0 ? body.events : [...WEBHOOK_EVENTS];
    const invalid = events.filter(e => !WEBHOOK_EVENTS.includes(e as any));
    if (invalid.length > 0) {
      throw new BadRequestException(`Unknown event(s): ${invalid.join(', ')}. Valid: ${WEBHOOK_EVENTS.join(', ')}`);
    }

    // Limit per user
    const count = await this.endpointRepo.count({ where: { userId, status: 'active' } });
    if (count >= 5) {
      throw new BadRequestException('Maximum 5 active webhook endpoints per account.');
    }

    // Generate a secure random secret
    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

    const endpoint = this.endpointRepo.create({
      userId,
      apiKeyId: body.apiKeyId || null,
      label: body.label || 'My Webhook',
      url: body.url,
      secret,
      events,
      status: 'active',
    });

    const saved = await this.endpointRepo.save(endpoint);

    // Return secret only once
    return {
      id: saved.id,
      label: saved.label,
      url: saved.url,
      events: saved.events,
      status: saved.status,
      secret, // raw secret — shown only at creation
      created_at: saved.createdAt,
    };
  }

  async list(userId: string) {
    const endpoints = await this.endpointRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return endpoints.map(e => ({
      id: e.id,
      label: e.label,
      url: e.url,
      events: e.events,
      status: e.status,
      created_at: e.createdAt,
      // secret NOT returned after creation
    }));
  }

  async delete(userId: string, endpointId: string) {
    const endpoint = await this.endpointRepo.findOne({ where: { id: endpointId, userId } });
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found.');
    await this.endpointRepo.remove(endpoint);
  }

  async disable(userId: string, endpointId: string) {
    const endpoint = await this.endpointRepo.findOne({ where: { id: endpointId, userId } });
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found.');
    endpoint.status = 'disabled';
    await this.endpointRepo.save(endpoint);
    return { id: endpoint.id, status: 'disabled' };
  }

  // ─── Deliveries ───────────────────────────────────────────────────────────

  async listDeliveries(userId: string, endpointId: string, limit = 50) {
    const endpoint = await this.endpointRepo.findOne({ where: { id: endpointId, userId } });
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found.');

    const deliveries = await this.deliveryRepo.find({
      where: { webhookEndpointId: endpointId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
    });

    return deliveries.map(d => ({
      id: d.id,
      event: d.event,
      success: d.success,
      attempt: d.attempt,
      response_status: d.responseStatus,
      response_body: d.responseBody,
      delivered_at: d.deliveredAt,
      created_at: d.createdAt,
    }));
  }

  // ─── Test ping ────────────────────────────────────────────────────────────

  async sendTestPing(userId: string, endpointId: string) {
    const endpoint = await this.endpointRepo.findOne({ where: { id: endpointId, userId } });
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found.');

    const testPayload = {
      event: 'test.ping',
      data: {
        message: 'This is a test webhook from AB Data Hub.',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    const result = await this.deliver(endpoint, 'test.ping', testPayload, 1);
    return {
      success: result.success,
      response_status: result.responseStatus,
      message: result.success
        ? 'Test ping delivered successfully.'
        : `Delivery failed (HTTP ${result.responseStatus || 'network error'})`,
    };
  }

  // ─── Fire — called after purchase ─────────────────────────────────────────

  /**
   * Find all active endpoints for this user that subscribe to `event`
   * and dispatch to them asynchronously (non-blocking).
   */
  async fire(
    userId: string,
    apiKeyId: string | null,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    const endpoints = await this.endpointRepo.find({
      where: { userId, status: 'active' },
    });

    const matching = endpoints.filter(e => {
      if (!e.events.includes(event)) return false;
      // If endpoint is scoped to a specific API key, only fire for that key
      if (e.apiKeyId && e.apiKeyId !== apiKeyId) return false;
      return true;
    });

    if (matching.length === 0) return;

    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    // Fire all deliveries in parallel, non-blocking — don't await
    for (const endpoint of matching) {
      this.dispatchWithRetry(endpoint, event, payload).catch(err => {
        this.logger.error(`Webhook dispatch error for endpoint ${endpoint.id}: ${err.message}`);
      });
    }
  }

  // ─── Internal delivery logic ──────────────────────────────────────────────

  private async dispatchWithRetry(
    endpoint: WebhookEndpoint,
    event: string,
    payload: Record<string, any>,
  ) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const result = await this.deliver(endpoint, event, payload, attempt);

      if (result.success) {
        this.logger.log(`Webhook ${endpoint.id} delivered (attempt ${attempt}) → ${endpoint.url}`);
        return;
      }

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt - 1] || 9000;
        this.logger.warn(`Webhook ${endpoint.id} attempt ${attempt} failed — retrying in ${delay}ms`);
        await sleep(delay);
      } else {
        this.logger.warn(`Webhook ${endpoint.id} exhausted all ${MAX_RETRIES} attempts.`);
      }
    }
  }

  private async deliver(
    endpoint: WebhookEndpoint,
    event: string,
    payload: Record<string, any>,
    attempt: number,
  ): Promise<{ success: boolean; responseStatus: number | null; responseBody: string | null }> {
    const body = JSON.stringify(payload);
    const signature = this.sign(endpoint.secret, body);

    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let success = false;

    try {
      const resp = await axios.post(endpoint.url, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-ABHub-Signature': `sha256=${signature}`,
          'X-ABHub-Event': event,
          'User-Agent': 'ABDataHub-Webhooks/1.0',
        },
        validateStatus: () => true, // Don't throw on non-2xx
      });

      responseStatus = resp.status;
      responseBody = String(resp.data || '').substring(0, 500);
      success = resp.status >= 200 && resp.status < 300;
    } catch (err: any) {
      responseBody = err.message?.substring(0, 500) || 'Network error';
    }

    // Log delivery to DB
    try {
      await this.deliveryRepo.save(
        this.deliveryRepo.create({
          webhookEndpointId: endpoint.id,
          event,
          payload,
          responseStatus,
          responseBody,
          attempt,
          success,
          deliveredAt: success ? new Date() : null,
        }),
      );
    } catch (logErr: any) {
      this.logger.error(`Failed to save webhook delivery log: ${logErr.message}`);
    }

    return { success, responseStatus, responseBody };
  }

  private sign(secret: string, body: string): string {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
