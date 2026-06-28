-- Initial database schema setup
-- Run this migration to create initial tables

-- Create users table
CREATE TABLE IF NOT EXISTS "user" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fullName" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "phoneNumber" VARCHAR(20) UNIQUE NOT NULL,
  "username" VARCHAR(100) UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "avatar" TEXT,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  "phoneVerified" BOOLEAN DEFAULT FALSE,
  "role" VARCHAR(50) DEFAULT 'user',
  "status" VARCHAR(50) DEFAULT 'active',
  "referralCode" VARCHAR(50) UNIQUE NOT NULL,
  "referredBy" UUID,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create wallet table
CREATE TABLE IF NOT EXISTS "wallet" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE,
  "balance" DECIMAL(20, 2) DEFAULT 0,
  "ledgerBalance" DECIMAL(20, 2) DEFAULT 0,
  "currency" VARCHAR(3) DEFAULT 'NGN',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS "transaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "service" VARCHAR(50) NOT NULL,
  "amount" DECIMAL(20, 2) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'pending',
  "reference" VARCHAR(100) UNIQUE NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Create wallet transactions table
CREATE TABLE IF NOT EXISTS "wallet_transaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "walletId" UUID NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "amount" DECIMAL(20, 2) NOT NULL,
  "description" VARCHAR(255),
  "reference" VARCHAR(100),
  "previousBalance" DECIMAL(20, 2),
  "newBalance" DECIMAL(20, 2),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_user_email ON "user"("email");
CREATE INDEX idx_user_phone ON "user"("phoneNumber");
CREATE INDEX idx_transaction_user ON "transaction"("userId");
CREATE INDEX idx_transaction_status ON "transaction"("status");
CREATE INDEX idx_wallet_user ON "wallet"("userId");
