import { Injectable, NotFoundException, BadRequestException, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey, ApiKeyScope, ApiKeyStatus } from '../entities/api-key.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ApiKeyService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async onApplicationBootstrap() {
    try {
      this.logger.log('Ensuring API platform tables exist...');
      const manager = this.apiKeyRepository.manager;

      await manager.query(`
        CREATE TABLE IF NOT EXISTS "api_key" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "userId" uuid NOT NULL,
          "name" character varying NOT NULL DEFAULT 'Default Key',
          "keyHash" character varying NOT NULL,
          "keyPrefix" character varying(8) NOT NULL,
          "scope" character varying NOT NULL DEFAULT 'full',
          "status" character varying NOT NULL DEFAULT 'active',
          "requestCount" bigint NOT NULL DEFAULT 0,
          "successCount" bigint NOT NULL DEFAULT 0,
          "failCount" bigint NOT NULL DEFAULT 0,
          "lastUsedAt" TIMESTAMP,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_api_key_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_api_key_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
        );
      `);

      await manager.query(`
        CREATE TABLE IF NOT EXISTS "api_request_log" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "apiKeyId" uuid,
          "userId" uuid,
          "endpoint" character varying NOT NULL,
          "method" character varying(10) NOT NULL,
          "statusCode" integer,
          "responseTimeMs" integer,
          "ipAddress" character varying,
          "errorCode" character varying,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_api_request_log_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_api_request_log_apiKey" FOREIGN KEY ("apiKeyId") REFERENCES "api_key"("id") ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS "IDX_api_request_log_apiKeyId_createdAt" ON "api_request_log" ("apiKeyId", "createdAt");
        CREATE INDEX IF NOT EXISTS "IDX_api_request_log_userId_createdAt" ON "api_request_log" ("userId", "createdAt");
      `);

      await manager.query(`
        CREATE TABLE IF NOT EXISTS "idempotency_key" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "key" character varying NOT NULL,
          "userId" uuid NOT NULL,
          "response" jsonb,
          "statusCode" integer,
          "expiresAt" TIMESTAMP NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_idempotency_key_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_idempotency_key_userId_key" UNIQUE ("userId", "key")
        );
      `);

      await manager.query(`
        ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "phoneNumber" character varying;
        ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "providerTransactionId" character varying;
        ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "providerResponse" jsonb;
        ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "failureReason" character varying;
        ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "apiKeyId" uuid;
        ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;
        ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now();
      `);

      this.logger.log('API platform tables and columns verified.');
    } catch (err: any) {
      this.logger.error('Failed to auto-verify API platform tables:', err.message);
    }
  }

  /**
   * Generate a new API key for a user. Returns the raw key only once.
   */
  async generate(
    userId: string,
    name: string,
    scope: ApiKeyScope = ApiKeyScope.FULL,
  ): Promise<{ key: string; apiKey: ApiKey }> {
    // Limit to 5 active keys per user
    const activeCount = await this.apiKeyRepository.count({
      where: { userId, status: ApiKeyStatus.ACTIVE },
    });
    if (activeCount >= 5) {
      throw new BadRequestException('You can have at most 5 active API keys. Please revoke an existing key first.');
    }

    // Generate a secure random key: "abdhk_" prefix + 40 hex chars
    const rawKey = 'abdhk_' + crypto.randomBytes(20).toString('hex');
    const keyPrefix = rawKey.substring(0, 8);
    const keyHash = await bcrypt.hash(rawKey, 10);

    const apiKey = this.apiKeyRepository.create({
      userId,
      name,
      keyHash,
      keyPrefix,
      scope,
      status: ApiKeyStatus.ACTIVE,
    });

    const saved = await this.apiKeyRepository.save(apiKey);
    return { key: rawKey, apiKey: saved };
  }

  /**
   * Validate a raw API key string. Returns the ApiKey record if valid.
   */
  async validate(rawKey: string): Promise<ApiKey | null> {
    if (!rawKey || !rawKey.startsWith('abdhk_')) return null;

    const prefix = rawKey.substring(0, 8);
    const candidates = await this.apiKeyRepository.find({
      where: { keyPrefix: prefix, status: ApiKeyStatus.ACTIVE },
    });

    for (const candidate of candidates) {
      const match = await bcrypt.compare(rawKey, candidate.keyHash);
      if (match) {
        return candidate;
      }
    }
    return null;
  }

  async findAllForUser(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(userId: string, keyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId },
    });
    if (!apiKey) throw new NotFoundException('API key not found');
    apiKey.status = ApiKeyStatus.REVOKED;
    await this.apiKeyRepository.save(apiKey);
  }

  async rename(userId: string, keyId: string, name: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId },
    });
    if (!apiKey) throw new NotFoundException('API key not found');
    apiKey.name = name;
    return this.apiKeyRepository.save(apiKey);
  }

  async incrementUsage(keyId: string, success: boolean): Promise<void> {
    await this.apiKeyRepository.increment({ id: keyId }, 'requestCount', 1);
    if (success) {
      await this.apiKeyRepository.increment({ id: keyId }, 'successCount', 1);
    } else {
      await this.apiKeyRepository.increment({ id: keyId }, 'failCount', 1);
    }
    await this.apiKeyRepository.update(keyId, { lastUsedAt: new Date() });
  }

  async getUserStats(userId: string) {
    const keys = await this.findAllForUser(userId);
    const activeKey = keys.find(k => k.status === ApiKeyStatus.ACTIVE);
    const totalRequests = keys.reduce((sum, k) => sum + k.requestCount, 0);
    const totalSuccess = keys.reduce((sum, k) => sum + k.successCount, 0);
    const totalFail = keys.reduce((sum, k) => sum + k.failCount, 0);
    return {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.status === ApiKeyStatus.ACTIVE).length,
      totalRequests,
      totalSuccess,
      totalFail,
      lastUsedAt: keys.reduce((latest, k) => {
        if (!k.lastUsedAt) return latest;
        if (!latest) return k.lastUsedAt;
        return k.lastUsedAt > latest ? k.lastUsedAt : latest;
      }, null as Date | null),
    };
  }

  // Admin: get all keys with user info
  async adminFindAll(): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async adminRevoke(keyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id: keyId } });
    if (!apiKey) throw new NotFoundException('API key not found');
    apiKey.status = ApiKeyStatus.REVOKED;
    await this.apiKeyRepository.save(apiKey);
  }
}
