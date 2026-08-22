import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyGuard, ApiKeyFullScopeGuard } from './api-key.guard';
import { ApiRateLimitGuard } from './api-rate-limit.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  providers: [ApiKeyService, ApiKeyGuard, ApiKeyFullScopeGuard, ApiRateLimitGuard],
  controllers: [ApiKeyController],
  exports: [ApiKeyService, ApiKeyGuard, ApiKeyFullScopeGuard, ApiRateLimitGuard],
})
export class ApiKeysModule {}
