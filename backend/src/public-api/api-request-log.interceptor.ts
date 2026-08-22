import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiRequestLog } from '../entities/api-request-log.entity';
import { ApiKeyService } from '../api-keys/api-key.service';
import { tap } from 'rxjs';

@Injectable()
export class ApiRequestLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiRequestLogInterceptor.name);

  constructor(
    @InjectRepository(ApiRequestLog)
    private logRepository: Repository<ApiRequestLog>,
    private apiKeyService: ApiKeyService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): any {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();

    return (next.handle() as any).pipe(
      tap({
        next: async () => {
          const res = context.switchToHttp().getResponse();
          await this.saveLog(req, res.statusCode || 200, Date.now() - start, null);
        },
        error: async (err: any) => {
          const statusCode = err.status || err.statusCode || 500;
          const errorCode = err.response?.error?.code || err.code || 'INTERNAL_ERROR';
          await this.saveLog(req, statusCode, Date.now() - start, errorCode);
        },
      }),
    );
  }

  private async saveLog(req: any, statusCode: number, responseTimeMs: number, errorCode: string | null) {
    try {
      const apiKeyId: string | null = req.apiKey?.id || null;
      const userId: string | null = req.user?.id || null;

      // Anonymize IP — zero out last octet
      const rawIp: string = req.ip || req.connection?.remoteAddress || '';
      const ipAddress = rawIp.replace(/(\d+)$/, '0');

      const log = this.logRepository.create({
        apiKeyId,
        userId,
        endpoint: req.url,
        method: req.method,
        statusCode,
        responseTimeMs,
        ipAddress,
        errorCode,
      });
      await this.logRepository.save(log);

      // Update API key usage counters
      if (apiKeyId) {
        await this.apiKeyService.incrementUsage(apiKeyId, statusCode < 400);
      }
    } catch (saveErr: any) {
      this.logger.error('Failed to save API request log:', saveErr.message);
    }
  }
}
