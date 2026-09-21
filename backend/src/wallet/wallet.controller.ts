import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Req() req: any) {
    const data = await this.walletService.findOneByUserId(req.user.id);
    return {
      success: true,
      data: {
        ...data,
        ledgerBalance: Math.max(0, Number(data.ledgerBalance)),
      },
    };
  }

  @Get('history')
  async getHistory(@Req() req: any, @Query('limit') limit?: string) {
    const safeLimit = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    const data = await this.walletService.getHistory(req.user.id, safeLimit);
    return {
      success: true,
      data,
    };
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const data = await this.walletService.getStats(req.user.id);
    return {
      success: true,
      data,
    };
  }
}
