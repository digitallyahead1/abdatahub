import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  async getHistory(@Req() req: any) {
    const data = await this.transactionsService.getUserHistory(req.user.id);
    return {
      success: true,
      data,
    };
  }
}
