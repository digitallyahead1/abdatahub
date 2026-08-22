const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log('Connected to database. Creating push notification & device token tables...');

  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS "device_token" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES "user"("id") ON DELETE CASCADE,
        "token" TEXT NOT NULL,
        "platform" VARCHAR(20) DEFAULT 'android',
        "deviceModel" VARCHAR(100),
        "appVersion" VARCHAR(50),
        "isActive" BOOLEAN DEFAULT TRUE,
        "lastSeenAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_device_token_token" ON "device_token" ("token");
      CREATE INDEX IF NOT EXISTS "IDX_device_token_userId" ON "device_token" ("userId");

      CREATE TABLE IF NOT EXISTS "push_notification_log" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "body" TEXT NOT NULL,
        "imageUrl" TEXT,
        "targetType" VARCHAR(50) DEFAULT 'all',
        "targetValue" VARCHAR(255),
        "successCount" INTEGER DEFAULT 0,
        "failureCount" INTEGER DEFAULT 0,
        "dataPayload" JSONB,
        "sentBy" VARCHAR(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Successfully created device_token and push_notification_log tables!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await client.end();
  }
}

run();
