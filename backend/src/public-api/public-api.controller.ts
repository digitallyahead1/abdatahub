import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard, ApiKeyFullScopeGuard } from '../api-keys/api-key.guard';
import { ApiRateLimitGuard } from '../api-keys/api-rate-limit.guard';
import { ApiRequestLogInterceptor } from './api-request-log.interceptor';

@Controller('v1')
@UseGuards(ApiRateLimitGuard)
@UseInterceptors(ApiRequestLogInterceptor)
export class PublicApiController {
  constructor(private publicApiService: PublicApiService) {}

  // ─── Networks ──────────────────────────────────────────────────────────────

  @Get('networks')
  @UseGuards(ApiKeyGuard)
  async getNetworks() {
    const data = await this.publicApiService.getNetworks();
    return {
      success: true,
      data,
      message: 'Networks retrieved successfully',
    };
  }

  @Get('networks/:networkId')
  @UseGuards(ApiKeyGuard)
  async getNetwork(@Param('networkId') networkId: string) {
    const data = await this.publicApiService.getNetwork(networkId);
    return { success: true, data, message: 'Network retrieved successfully' };
  }

  // ─── Data Plans ───────────────────────────────────────────────────────────

  @Get('data/plans')
  @UseGuards(ApiKeyGuard)
  async getDataPlans(
    @Query('network') network?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.publicApiService.getDataPlans(network, status);
    return {
      success: true,
      data,
      message: 'Data plans retrieved successfully',
    };
  }

  @Get('data/plans/:planId')
  @UseGuards(ApiKeyGuard)
  async getDataPlan(@Param('planId') planId: string) {
    const data = await this.publicApiService.getDataPlan(planId);
    return { success: true, data, message: 'Data plan retrieved successfully' };
  }

  // ─── Purchase ─────────────────────────────────────────────────────────────

  @Post('data/purchase')
  @UseGuards(ApiKeyFullScopeGuard)
  @HttpCode(HttpStatus.CREATED)
  async purchaseData(@Req() req: any, @Body() body: any) {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    const data = await this.publicApiService.purchaseData(
      req.user.id,
      req.apiKey.id,
      {
        network: body.network,
        plan_id: body.plan_id,
        phone: body.phone,
        idempotency_key: idempotencyKey,
      },
    );
    const isSuccess = data.status === 'success';
    return {
      success: isSuccess,
      data,
      message: data.message,
    };
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  @Get('transactions')
  @UseGuards(ApiKeyGuard)
  async getTransactions(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.publicApiService.getTransactions(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? Math.min(parseInt(limit, 10), 100) : 20,
      status,
    );
    return { success: true, ...result, message: 'Transactions retrieved successfully' };
  }

  @Get('transactions/:reference')
  @UseGuards(ApiKeyGuard)
  async getTransaction(@Req() req: any, @Param('reference') reference: string) {
    const data = await this.publicApiService.getTransaction(req.user.id, reference);
    return { success: true, data, message: 'Transaction retrieved successfully' };
  }
}
