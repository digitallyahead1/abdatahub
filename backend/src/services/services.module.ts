import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Transaction } from '../entities/transaction.entity';
import { DataPlan } from '../entities/data-plan.entity';
import { AirtimePricing } from '../entities/airtime-pricing.entity';
import { DataTransaction } from '../entities/data-transaction.entity';
import { AirtimeTransaction } from '../entities/airtime-transaction.entity';
import { SyncLog } from '../entities/sync-log.entity';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';
import { SmePlugService } from './smeplug.service';
import { SmePlugSyncService } from './smeplug-sync.service';
import { IacafeService } from './iacafe.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      DataPlan,
      AirtimePricing,
      DataTransaction,
      AirtimeTransaction,
      SyncLog,
    ]),
    WalletModule,
    UsersModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [ServicesController],
  providers: [ServicesService, SmePlugService, SmePlugSyncService, IacafeService],
  exports: [ServicesService, SmePlugService, SmePlugSyncService, IacafeService],
})
export class ServicesModule {}
