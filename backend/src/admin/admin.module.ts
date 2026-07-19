import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { DataPlan } from '../entities/data-plan.entity';
import { AirtimePricing } from '../entities/airtime-pricing.entity';
import { SyncLog } from '../entities/sync-log.entity';
import { DataTransaction } from '../entities/data-transaction.entity';
import { AirtimeTransaction } from '../entities/airtime-transaction.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ServicesModule } from '../services/services.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { SystemSetting } from '../entities/system-setting.entity';
import { ExamCategory } from '../entities/exam-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Wallet,
      Transaction,
      WalletTransaction,
      AuditLog,
      DataPlan,
      AirtimePricing,
      SyncLog,
      DataTransaction,
      AirtimeTransaction,
      SystemSetting,
      ExamCategory,
    ]),
    AuditLogModule,
    forwardRef(() => ServicesModule),
    WalletModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
