import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiKeyService } from './api-key.service';
import { ApiKeyScope } from '../entities/api-key.entity';

@Controller('user/api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Get()
  async listKeys(@Req() req: any) {
    const keys = await this.apiKeyService.findAllForUser(req.user.id);
    return {
      success: true,
      data: keys.map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        maskedKey: `${k.keyPrefix}${'*'.repeat(34)}`,
        scope: k.scope,
        status: k.status,
        requestCount: k.requestCount,
        successCount: k.successCount,
        failCount: k.failCount,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
      })),
    };
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const stats = await this.apiKeyService.getUserStats(req.user.id);
    return { success: true, data: stats };
  }

  @Post('generate')
  async generateKey(
    @Req() req: any,
    @Body('name') name: string,
    @Body('scope') scope: ApiKeyScope,
  ) {
    const { key, apiKey } = await this.apiKeyService.generate(
      req.user.id,
      name || 'My API Key',
      scope || ApiKeyScope.FULL,
    );

    return {
      success: true,
      message: 'API key generated. This is the only time the full key will be shown.',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key, // Raw key — shown ONCE
        keyPrefix: apiKey.keyPrefix,
        maskedKey: `${apiKey.keyPrefix}${'*'.repeat(34)}`,
        scope: apiKey.scope,
        status: apiKey.status,
        createdAt: apiKey.createdAt,
      },
    };
  }

  @Delete(':id')
  async revokeKey(@Req() req: any, @Param('id') keyId: string) {
    await this.apiKeyService.revoke(req.user.id, keyId);
    return {
      success: true,
      message: 'API key has been revoked successfully.',
    };
  }

  @Patch(':id/rename')
  async renameKey(
    @Req() req: any,
    @Param('id') keyId: string,
    @Body('name') name: string,
  ) {
    const updated = await this.apiKeyService.rename(req.user.id, keyId, name);
    return {
      success: true,
      message: 'API key renamed.',
      data: { id: updated.id, name: updated.name },
    };
  }
}
