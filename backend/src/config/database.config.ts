import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { DataPlan } from '../entities/data-plan.entity';
import { AirtimePricing } from '../entities/airtime-pricing.entity';
import { DataTransaction } from '../entities/data-transaction.entity';
import { AirtimeTransaction } from '../entities/airtime-transaction.entity';
import { SyncLog } from '../entities/sync-log.entity';
import { SystemSetting } from '../entities/system-setting.entity';

import { ExamCategory } from '../entities/exam-category.entity';
import { ExamPin } from '../entities/exam-pin.entity';
import { PasswordResetOtp } from '../entities/password-reset-otp.entity';
import { UserVirtualAccount } from '../entities/user-virtual-account.entity';
import { GafiapayVirtualAccount } from '../entities/gafiapay-virtual-account.entity';

// Parse DATABASE_URL if provided (e.g. Supabase pooler URL)
const databaseUrl = process.env.DATABASE_URL;
let connectionConfig: Partial<TypeOrmModuleOptions & { type: 'postgres' }>;

if (databaseUrl && databaseUrl.includes('supabase.com')) {
  // Supabase connection via URL
  const url = new URL(databaseUrl);
  connectionConfig = {
    type: 'postgres',
    host: url.hostname,
    port: parseInt(url.port || '6543', 10),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: false },
  };
} else {
  // Local / direct connection via individual env vars
  connectionConfig = {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'abdatahub_user',
    password: process.env.DATABASE_PASSWORD || 'Abdatahub@',
    database: process.env.DATABASE_NAME || 'ab_data_hub',
  };
}

export const DatabaseConfig: TypeOrmModuleOptions = {
  ...connectionConfig,
  type: 'postgres',
  entities: [
    User,
    Wallet,
    Transaction,
    WalletTransaction,
    AuditLog,
    DataPlan,
    AirtimePricing,
    DataTransaction,
    AirtimeTransaction,
    SyncLog,
    SystemSetting,
    ExamCategory,
    ExamPin,
    PasswordResetOtp,
    UserVirtualAccount,
    GafiapayVirtualAccount,
  ],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  connectTimeoutMS: 20000,
  extra: {
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
};
