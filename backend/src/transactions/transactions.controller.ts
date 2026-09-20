import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  async getHistory(@Req() req: any, @Query('limit') limit?: string) {
    const safeLimit = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    const data = await this.transactionsService.getUserHistory(req.user.id, safeLimit);
    return {
      success: true,
      data,
    };
  }
}
