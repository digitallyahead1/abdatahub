import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { DeviceToken } from '../entities/device-token.entity';
import { PushNotificationLog } from '../entities/push-notification-log.entity';
import { User } from '../entities/user.entity';

export interface SendPushOptions {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  targetType: 'all' | 'agents' | 'user';
  targetValue?: string;
  sentBy?: string;
}

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private isFirebaseReady = false;

  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepo: Repository<DeviceToken>,
    @InjectRepository(PushNotificationLog)
    private pushLogRepo: Repository<PushNotificationLog>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  onModuleInit() {
    this.initFirebase();
  }

  private initFirebase(): void {
    if (admin.apps.length) {
      this.isFirebaseReady = true;
      this.logger.log('Firebase Admin SDK already initialized (reusing existing app)');
      return;
    }

    try {
      let credential: admin.ServiceAccount | undefined;

      // 1. Try env var first (best for production/Railway deployments)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
          credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
          this.logger.log('Loaded Firebase Admin credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var');
        } catch (e: any) {
          this.logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', e?.message);
        }
      }

      // 2. Fallback: try well-known file paths
      if (!credential) {
        const candidatePaths = [
          process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
          path.resolve(__dirname, '../config/firebase-service-account.json'),
          path.resolve(__dirname, '../../src/config/firebase-service-account.json'),
          path.resolve(process.cwd(), 'src/config/firebase-service-account.json'),
          path.resolve(process.cwd(), 'dist/config/firebase-service-account.json'),
          path.resolve(process.cwd(), 'config/firebase-service-account.json'),
        ].filter(Boolean) as string[];

        for (const p of candidatePaths) {
          if (fs.existsSync(p)) {
            try {
              credential = JSON.parse(fs.readFileSync(p, 'utf8'));
              this.logger.log(`Loaded Firebase Admin credentials from: ${p}`);
              break;
            } catch (loadErr: any) {
              this.logger.warn(`Failed reading credential from ${p}: ${loadErr?.message}`);
            }
          }
        }
      }

      if (!credential) {
        this.logger.warn(
          'Firebase Admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var or place firebase-service-account.json in backend/src/config/. Push notifications will be skipped.',
        );
        return;
      }

      admin.initializeApp({ credential: admin.credential.cert(credential) });
      this.isFirebaseReady = true;
      this.logger.log(`Firebase Admin SDK initialized for project: ${(credential as any).project_id}`);
    } catch (err: any) {
      this.logger.error('Failed to initialize Firebase Admin SDK', err?.stack || err?.message);
    }
  }

  // ─── Device Token Registration ──────────────────────────────────────────────

  async registerDeviceToken(
    userId: string | null,
    token: string,
    platform: string = 'android',
    deviceModel?: string,
    appVersion?: string,
  ): Promise<void> {
    if (!token || token.length < 10) {
      this.logger.warn('registerDeviceToken: ignoring invalid/empty token');
      return;
    }

    const existing = await this.deviceTokenRepo.findOne({ where: { token } });
    if (existing) {
      if (userId) existing.userId = userId;
      existing.platform = platform;
      existing.isActive = true;
      existing.lastSeenAt = new Date();
      if (deviceModel) existing.deviceModel = deviceModel;
      if (appVersion) existing.appVersion = appVersion;
      await this.deviceTokenRepo.save(existing);
    } else {
      await this.deviceTokenRepo.save(
        this.deviceTokenRepo.create({
          userId: userId ?? null,
          token,
          platform,
          deviceModel: deviceModel ?? null,
          appVersion: appVersion ?? null,
          isActive: true,
          lastSeenAt: new Date(),
        }),
      );
    }
  }

  async removeDeviceToken(token: string): Promise<void> {
    await this.deviceTokenRepo.update({ token }, { isActive: false });
  }

  async removeTokensForUser(userId: string): Promise<void> {
    await this.deviceTokenRepo.update({ userId }, { isActive: false });
  }

  // ─── Push Dispatch ───────────────────────────────────────────────────────────

  async sendPush(options: SendPushOptions): Promise<{
    successCount: number;
    failureCount: number;
    logId: string;
  }> {
    const { title, body, imageUrl, data = {}, targetType, targetValue, sentBy } = options;

    if (!this.isFirebaseReady) {
      this.initFirebase();
      if (!this.isFirebaseReady) {
        this.logger.warn('sendPush: Firebase Admin not initialized — push skipped.');
        const logId = await this.saveLog({ title, body, imageUrl, targetType, targetValue, successCount: 0, failureCount: 0, data, sentBy });
        return { successCount: 0, failureCount: 0, logId };
      }
    }

    // Collect tokens by target
    let tokens: string[] = [];

    if (targetType === 'all') {
      const rows = await this.deviceTokenRepo.find({ where: { isActive: true } });
      tokens = this.deduplicateTokens(rows);
    } else if (targetType === 'agents') {
      const agents = await this.userRepo.find({
        where: [{ agentStatus: 'approved' }, { role: 'agent' }],
        select: ['id'],
      });
      const agentIds = agents.map((a) => a.id);
      if (agentIds.length > 0) {
        const rows = await this.deviceTokenRepo.find({ where: { userId: In(agentIds), isActive: true } });
        tokens = this.deduplicateTokens(rows);
      }
    } else if (targetType === 'user' && targetValue) {
      let user = await this.userRepo.findOne({ where: { id: targetValue } });
      if (!user) user = await this.userRepo.findOne({ where: { phoneNumber: targetValue } });
      if (!user) user = await this.userRepo.findOne({ where: { email: targetValue } });
      if (user) {
        const rows = await this.deviceTokenRepo.find({ where: { userId: user.id, isActive: true } });
        tokens = this.deduplicateTokens(rows);
      }
    }

    if (tokens.length === 0) {
      this.logger.warn(`sendPush: no active device tokens for target ${targetType}/${targetValue ?? 'N/A'}`);
      const logId = await this.saveLog({ title, body, imageUrl, targetType, targetValue, successCount: 0, failureCount: 0, data, sentBy });
      return { successCount: 0, failureCount: 0, logId };
    }

    // Coerce all data values to string (FCM strict requirement)
    const stringifiedData: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== null) {
        stringifiedData[String(k)] = typeof v === 'string' ? v : JSON.stringify(v);
      }
    }
    stringifiedData['title'] = String(title || '');
    stringifiedData['body'] = String(body || '');
    stringifiedData['click_action'] = 'FLUTTER_NOTIFICATION_CLICK';
    if (imageUrl) stringifiedData['imageUrl'] = imageUrl;

    const CHUNK = 500;
    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokens: string[] = [];

    try {
      for (let i = 0; i < tokens.length; i += CHUNK) {
        const chunk = tokens.slice(i, i + CHUNK);

        // Use sendEach (current API — sendEachForMulticast is deprecated)
        const messages: admin.messaging.Message[] = chunk.map((token) => ({
          token,
          notification: {
            title,
            body,
            ...(imageUrl ? { imageUrl } : {}),
          },
          android: {
            priority: 'high' as const,
            ttl: 86400000, // 24 hours
            notification: {
              sound: 'default',
              channelId: 'ab_data_hub_alerts',
              icon: 'ic_notification',  // White transparent drawable for status bar
              color: '#1E40AF',         // Brand blue tint
              ...(imageUrl ? { imageUrl } : {}),
            },
          },
          apns: {
            headers: { 'apns-priority': '10' },
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                'content-available': 1 as any,
              },
            },
          },
          data: stringifiedData,
        }));

        const response = await admin.messaging().sendEach(messages);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              invalidTokens.push(chunk[idx]);
            }
            this.logger.warn(`FCM failure token[${idx}]: code=${code} msg=${resp.error?.message ?? 'unknown'}`);
          }
        });
      }

      // Async deactivate stale tokens without blocking response
      if (invalidTokens.length > 0) {
        this.deviceTokenRepo
          .update({ token: In(invalidTokens) }, { isActive: false })
          .then(() => this.logger.log(`Deactivated ${invalidTokens.length} stale FCM tokens`))
          .catch((e: any) => this.logger.warn('Stale token deactivation error: ' + e?.message));
      }

      const logId = await this.saveLog({ title, body, imageUrl, targetType, targetValue, successCount: totalSuccess, failureCount: totalFailure, data, sentBy });
      this.logger.log(`Push sent — success: ${totalSuccess}, failure: ${totalFailure}, tokens: ${tokens.length}`);
      return { successCount: totalSuccess, failureCount: totalFailure, logId };

    } catch (err: any) {
      this.logger.error('Unhandled error in sendPush', err?.stack || err?.message);
      const logId = await this.saveLog({ title, body, imageUrl, targetType, targetValue, successCount: totalSuccess, failureCount: totalFailure, data, sentBy });
      throw err;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Deduplicate tokens per userId — keeps the most recently seen token for each user.
   * Anonymous tokens (userId=null) are all kept.
   */
  private deduplicateTokens(rows: DeviceToken[]): string[] {
    const perUser = new Map<string, DeviceToken>();
    const anon: string[] = [];

    for (const row of rows) {
      if (!row.userId) {
        anon.push(row.token);
        continue;
      }
      const prev = perUser.get(row.userId);
      if (!prev || new Date(row.lastSeenAt) > new Date(prev.lastSeenAt)) {
        perUser.set(row.userId, row);
      }
    }

    return [
      ...Array.from(perUser.values()).map((r) => r.token),
      ...anon,
    ].filter((t) => t && t.length > 10);
  }

  private async saveLog(opts: {
    title: string;
    body: string;
    imageUrl?: string;
    targetType: string;
    targetValue?: string;
    successCount: number;
    failureCount: number;
    data?: Record<string, any>;
    sentBy?: string;
  }): Promise<string> {
    try {
      const log = await this.pushLogRepo.save(
        this.pushLogRepo.create({
          title: opts.title,
          body: opts.body,
          imageUrl: opts.imageUrl ?? null,
          targetType: opts.targetType,
          targetValue: opts.targetValue ?? null,
          successCount: opts.successCount,
          failureCount: opts.failureCount,
          dataPayload: opts.data ?? null,
          sentBy: opts.sentBy ?? null,
        }),
      );
      return log.id;
    } catch (dbErr: any) {
      this.logger.warn('Could not save push log: ' + dbErr?.message);
      return 'log-unsaved';
    }
  }

  // ─── History ─────────────────────────────────────────────────────────────────

  async getHistory(limit = 50): Promise<PushNotificationLog[]> {
    return this.pushLogRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async getActiveTokenCount(): Promise<number> {
    return this.deviceTokenRepo.count({ where: { isActive: true } });
  }

  // ─── Diagnostics ─────────────────────────────────────────────────────────────

  async listActiveTokens(): Promise<DeviceToken[]> {
    return this.deviceTokenRepo.find({ where: { isActive: true }, order: { lastSeenAt: 'DESC' } });
  }

  async clearAllStaleTokens(): Promise<{ cleared: number }> {
    const stale = await this.deviceTokenRepo.find({ where: { isActive: false } });
    if (stale.length > 0) await this.deviceTokenRepo.delete(stale.map((t) => t.id));
    return { cleared: stale.length };
  }

  async clearAllTokens(): Promise<{ cleared: number }> {
    const all = await this.deviceTokenRepo.find();
    if (all.length > 0) await this.deviceTokenRepo.delete(all.map((t) => t.id));
    this.logger.log(`Cleared ALL ${all.length} device tokens`);
    return { cleared: all.length };
  }

  async sendTestToSingleToken(fcmToken: string, title: string, body: string): Promise<any> {
    if (!this.isFirebaseReady) return { success: false, error: 'Firebase Admin not initialized' };
    try {
      const result = await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: { sound: 'default', channelId: 'ab_data_hub_alerts', icon: 'ic_notification', color: '#1E40AF' },
        },
        apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default', badge: 1 } } },
        data: { title, body, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      });
      return { success: true, messageId: result };
    } catch (err: any) {
      return { success: false, error: err?.message, code: err?.errorInfo?.code };
    }
  }

  isReady(): boolean {
    return this.isFirebaseReady;
  }
}
