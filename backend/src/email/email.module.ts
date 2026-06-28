import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
