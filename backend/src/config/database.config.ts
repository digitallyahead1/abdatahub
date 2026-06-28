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

export const DatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'abdatahub_user',
  password: process.env.DATABASE_PASSWORD || 'Abdatahub@',
  database: process.env.DATABASE_NAME || 'ab_data_hub',
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
  ],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  connectTimeoutMS: 20000,
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};
