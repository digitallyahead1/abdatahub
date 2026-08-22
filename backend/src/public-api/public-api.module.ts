import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataPlan } from '../entities/data-plan.entity';
import { DataTransaction } from '../entities/data-transaction.entity';
import { Transaction } from '../entities/transaction.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { ApiRequestLog } from '../entities/api-request-log.entity';
import { PublicApiService } from './public-api.service';
import { PublicApiController } from './public-api.controller';
import { ApiRequestLogInterceptor } from './api-request-log.interceptor';
import { ApiKeysModule } from '../api-keys/api-key.module';
import { WalletModule } from '../wallet/wallet.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataPlan, DataTransaction, Transaction, IdempotencyKey, ApiRequestLog]),
    ApiKeysModule,
    WalletModule,
    ServicesModule,
    UsersModule,
  ],
  providers: [PublicApiService, ApiRequestLogInterceptor],
  controllers: [PublicApiController],
  exports: [PublicApiService],
})
export class PublicApiModule {}
