import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    userId: string | null,
    email: string,
    action: string,
    details: any = null,
    ipAddress: string = '',
  ) {
    try {
      const auditLog = this.auditLogRepository.create({
        userId,
        userEmail: email,
        action,
        details,
        ipAddress,
      });
      return await this.auditLogRepository.save(auditLog);
    } catch (err) {
      console.error('Failed to save audit log:', err);
    }
  }

  async findAll(limit = 500) {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
