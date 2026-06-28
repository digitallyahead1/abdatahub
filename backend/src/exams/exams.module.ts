import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamCategory } from '../entities/exam-category.entity';
import { ExamPin } from '../entities/exam-pin.entity';
import { Transaction } from '../entities/transaction.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { UsersModule } from '../users/users.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamCategory, ExamPin, Transaction, WalletTransaction]),
    UsersModule,
    AuditLogModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
