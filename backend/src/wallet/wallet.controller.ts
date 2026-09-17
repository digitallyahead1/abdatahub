import { Controller, Get, UseGuards, Req } from '@nestjs/common';
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
      data,
    };
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    const data = await this.walletService.getHistory(req.user.id);
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
