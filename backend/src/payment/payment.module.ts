import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserVirtualAccount } from '../entities/user-virtual-account.entity';
import { GafiapayVirtualAccount } from '../entities/gafiapay-virtual-account.entity';
import { Transaction } from '../entities/transaction.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WebhooksController } from './webhooks.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserVirtualAccount, GafiapayVirtualAccount, Transaction]),
    WalletModule,
  ],
  providers: [PaymentService],
  controllers: [PaymentController, WebhooksController],
  exports: [PaymentService],
})
export class PaymentModule {}
