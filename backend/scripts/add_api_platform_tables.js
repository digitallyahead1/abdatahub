const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  let client;

  if (databaseUrl) {
    client = new Client({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
    });
  } else {
    client = new Client({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      user: process.env.DATABASE_USER || 'abdatahub_user',
      password: process.env.DATABASE_PASSWORD || 'Abdatahub@',
      database: process.env.DATABASE_NAME || 'ab_data_hub',
    });
  }

  try {
    await client.connect();
    console.log('Connected to database. Applying API Platform migrations...');

    // 1. Enum types
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "api_key_scope_enum" AS ENUM ('read', 'full');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "api_key_status_enum" AS ENUM ('active', 'revoked');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. api_key table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "api_key" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "name" character varying NOT NULL DEFAULT 'Default Key',
        "keyHash" character varying NOT NULL,
        "keyPrefix" character varying(8) NOT NULL,
        "scope" "api_key_scope_enum" NOT NULL DEFAULT 'full',
        "status" "api_key_status_enum" NOT NULL DEFAULT 'active',
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

    // 3. api_request_log table
    await client.query(`
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

    // 4. idempotency_key table
    await client.query(`
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

    // 5. Extend data_transaction columns
    await client.query(`
      ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "phoneNumber" character varying;
      ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "providerTransactionId" character varying;
      ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "providerResponse" jsonb;
      ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "failureReason" character varying;
      ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "apiKeyId" uuid;
      ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;
      ALTER TABLE "data_transaction" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now();
    `);

    console.log('✅ API platform database schema successfully migrated.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.end();
  }
}

run();
