import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { DeviceToken } from '../entities/device-token.entity';
import { PushNotificationLog } from '../entities/push-notification-log.entity';
import { User } from '../entities/user.entity';

export interface SendPushOptions {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  targetType: 'all' | 'agents' | 'user';
  targetValue?: string; // userId or phone when targetType === 'user'
  sentBy?: string; // admin email
}

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private firebaseApp: admin.app.App;

  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepo: Repository<DeviceToken>,
    @InjectRepository(PushNotificationLog)
    private pushLogRepo: Repository<PushNotificationLog>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  onModuleInit() {
    if (!admin.apps.length) {
      try {
        let credential: admin.ServiceAccount | undefined;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
          try {
            credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            this.logger.log('Loaded Firebase Admin credentials from FIREBASE_SERVICE_ACCOUNT_JSON');
          } catch (e: any) {
            this.logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable', e);
          }
        }

        if (!credential) {
          const fs = require('fs');
          const candidatePaths = [
            process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
            path.resolve(__dirname, '../config/firebase-service-account.json'),
            path.resolve(__dirname, '../../src/config/firebase-service-account.json'),
            path.resolve(process.cwd(), 'src/config/firebase-service-account.json'),
            path.resolve(process.cwd(), 'dist/config/firebase-service-account.json'),
            path.resolve(process.cwd(), 'config/firebase-service-account.json'),
            path.resolve(process.cwd(), 'backend/src/config/firebase-service-account.json'),
            path.resolve(__dirname, '../../../backend/src/config/firebase-service-account.json'),
          ].filter(Boolean);

          for (const p of candidatePaths) {
            if (p && fs.existsSync(p)) {
              try {
                credential = require(p);
                this.logger.log(`Loaded Firebase Admin credentials from: ${p}`);
                break;
              } catch (loadErr) {
                this.logger.warn(`Failed reading credential from ${p}: ${loadErr}`);
              }
            }
          }
        }

        if (credential) {
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(credential),
          });
          this.logger.log('Firebase Admin SDK initialized successfully');
        } else {
          this.logger.warn(
            'Firebase Admin credentials not found (set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, or place backend/src/config/firebase-service-account.json). Push notifications will be skipped.',
          );
        }
      } catch (err: any) {
        this.logger.error('Failed to initialize Firebase Admin SDK', err?.stack || err);
      }
    } else {
      this.firebaseApp = admin.app();
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
    const existing = await this.deviceTokenRepo.findOne({ where: { token } });
    if (existing) {
      // Update ownership / metadata - only overwrite userId if a new valid userId is provided
      if (userId) {
        existing.userId = userId;
      }
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

    // Collect tokens based on target
    let tokens: string[] = [];

    if (targetType === 'all') {
      const rows = await this.deviceTokenRepo.find({ where: { isActive: true } });
      tokens = rows.map((r) => r.token);
    } else if (targetType === 'agents') {
      // Fetch user IDs of approved agents
      const agents = await this.userRepo.find({
        where: [
          { agentStatus: 'approved' },
          { role: 'agent' },
        ],
        select: ['id'],
      });
      const agentIds = agents.map((a) => a.id);
      if (agentIds.length > 0) {
        const rows = await this.deviceTokenRepo.find({
          where: { userId: In(agentIds), isActive: true },
        });
        tokens = rows.map((r) => r.token);
      }
    } else if (targetType === 'user' && targetValue) {
      // targetValue can be userId or phone/email — try userId first
      let user = await this.userRepo.findOne({ where: { id: targetValue } });
      if (!user) {
        user = await this.userRepo.findOne({ where: { phoneNumber: targetValue } });
      }
      if (!user) {
        user = await this.userRepo.findOne({ where: { email: targetValue } });
      }
      if (user) {
        const rows = await this.deviceTokenRepo.find({
          where: { userId: user.id, isActive: true },
        });
        tokens = rows.map((r) => r.token);
      }
    }

    try {
      if (tokens.length === 0) {
        this.logger.warn(`sendPush: no active registered device tokens found for target ${targetType}/${targetValue}`);
        let logId = 'log-none';
        try {
          const log = await this.pushLogRepo.save(
            this.pushLogRepo.create({
              title,
              body,
              imageUrl: imageUrl ?? null,
              targetType,
              targetValue: targetValue ?? null,
              successCount: 0,
              failureCount: 0,
              dataPayload: data,
              sentBy: sentBy ?? null,
            }),
          );
          logId = log.id;
        } catch (dbErr: any) {
          this.logger.warn('Could not save push log to DB (table may be syncing): ' + dbErr?.message);
        }
        return { successCount: 0, failureCount: 0, logId };
      }

      if (!admin.apps.length) {
        this.logger.warn('sendPush: Firebase Admin is not initialized. Cannot dispatch push notifications.');
        let logId = 'log-uninit';
        try {
          const log = await this.pushLogRepo.save(
            this.pushLogRepo.create({
              title,
              body,
              imageUrl: imageUrl ?? null,
              targetType,
              targetValue: targetValue ?? null,
              successCount: 0,
              failureCount: tokens.length,
              dataPayload: data,
              sentBy: sentBy ?? null,
            }),
          );
          logId = log.id;
        } catch (dbErr: any) {
          this.logger.warn('Could not save push log to DB: ' + dbErr?.message);
        }
        return { successCount: 0, failureCount: tokens.length, logId };
      }

      // FCM allows max 500 tokens per sendEachForMulticast call
      const CHUNK = 500;
      let totalSuccess = 0;
      let totalFailure = 0;
      const invalidTokens: string[] = [];

      // Ensure all values in data are strings because FCM strictly requires Record<string, string>
      const stringifiedData: Record<string, string> = {};
      if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          if (v !== undefined && v !== null) {
            stringifiedData[String(k)] = typeof v === 'string' ? v : JSON.stringify(v);
          }
        }
      }
      stringifiedData['title'] = String(title || '');
      stringifiedData['body'] = String(body || '');
      stringifiedData['click_action'] = 'FLUTTER_NOTIFICATION_CLICK';

      for (let i = 0; i < tokens.length; i += CHUNK) {
        const chunk = tokens.slice(i, i + CHUNK);
        const message: admin.messaging.MulticastMessage = {
          tokens: chunk,
          notification: {
            title,
            body,
            ...(imageUrl ? { imageUrl } : {}),
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'ab_data_hub_alerts',
              ...(imageUrl ? { imageUrl } : {}),
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
          data: stringifiedData,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        // Collect invalid / unregistered tokens to deactivate
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              invalidTokens.push(chunk[idx]);
            }
            this.logger.warn(`FCM error for token ${chunk[idx]}: ${code}`);
          }
        });
      }

      // Deactivate stale tokens
      if (invalidTokens.length > 0) {
        try {
          await this.deviceTokenRepo.update(
            { token: In(invalidTokens) },
            { isActive: false },
          );
          this.logger.log(`Deactivated ${invalidTokens.length} stale FCM tokens`);
        } catch (e: any) {
          this.logger.warn('Failed to deactivate invalid tokens: ' + e?.message);
        }
      }

      // Save log
      let logId = 'log-done';
      try {
        const log = await this.pushLogRepo.save(
          this.pushLogRepo.create({
            title,
            body,
            imageUrl: imageUrl ?? null,
            targetType,
            targetValue: targetValue ?? null,
            successCount: totalSuccess,
            failureCount: totalFailure,
            dataPayload: data,
            sentBy: sentBy ?? null,
          }),
        );
        logId = log.id;
      } catch (dbErr: any) {
        this.logger.warn('Could not save push log to DB: ' + dbErr?.message);
      }

      this.logger.log(
        `Push sent — success: ${totalSuccess}, failure: ${totalFailure}, logId: ${logId}`,
      );
      return { successCount: totalSuccess, failureCount: totalFailure, logId };
    } catch (err: any) {
      this.logger.error('Unhandled error in sendPush', err?.stack || err);
      throw err;
    }
  }

  // ─── History ─────────────────────────────────────────────────────────────────

  async getHistory(limit = 50): Promise<PushNotificationLog[]> {
    return this.pushLogRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getActiveTokenCount(): Promise<number> {
    return this.deviceTokenRepo.count({ where: { isActive: true } });
  }

  // ─── Diagnostics ─────────────────────────────────────────────────────────────

  async listActiveTokens(): Promise<DeviceToken[]> {
    return this.deviceTokenRepo.find({
      where: { isActive: true },
      order: { lastSeenAt: 'DESC' },
    });
  }

  async clearAllStaleTokens(): Promise<{ cleared: number }> {
    const staleTokens = await this.deviceTokenRepo.find({ where: { isActive: false } });
    if (staleTokens.length > 0) {
      await this.deviceTokenRepo.delete(staleTokens.map((t) => t.id));
    }
    return { cleared: staleTokens.length };
  }

  async clearAllTokens(): Promise<{ cleared: number }> {
    const all = await this.deviceTokenRepo.find();
    if (all.length > 0) {
      await this.deviceTokenRepo.delete(all.map((t) => t.id));
    }
    this.logger.log(`Cleared ALL ${all.length} device tokens from database`);
    return { cleared: all.length };
  }

  async sendTestToSingleToken(fcmToken: string, title: string, body: string): Promise<any> {
    if (!admin.apps.length) {
      return { success: false, error: 'Firebase Admin not initialized' };
    }
    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: { sound: 'default', channelId: 'ab_data_hub_alerts' },
        },
        data: { title, body, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      };
      const result = await admin.messaging().send(message);
      return { success: true, messageId: result };
    } catch (err: any) {
      return { success: false, error: err?.message, code: err?.errorInfo?.code };
    }
  }
}
