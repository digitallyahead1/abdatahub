import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('monnify-account')
  async getMonnifyAccount(@Req() req: any) {
    const account = await this.paymentService.getMonnifyAccount(req.user.id);
    return {
      success: true,
      exists: !!account,
      account,
    };
  }

  @Post('monnify-account/generate')
  async generateMonnifyAccount(@Req() req: any) {
    const account = await this.paymentService.generateMonnifyAccount(
      req.user.id,
      req.user.email,
      req.user.fullName,
    );
    return {
      success: true,
      message: 'Monnify permanent virtual account generated successfully',
      account,
    };
  }

  @Get('gafiapay/active')
  async getActiveGafiapayAccount(@Req() req: any) {
    const account = await this.paymentService.getActiveGafiapayAccount(req.user.id);
    return {
      success: true,
      exists: !!account,
      account,
    };
  }

  @Post('gafiapay/generate')
  async generateGafiapayAccount(@Req() req: any) {
    const account = await this.paymentService.generateGafiapayAccount(
      req.user.id,
      req.user.email,
      req.user.fullName,
    );
    return {
      success: true,
      message: 'Gafiapay permanent virtual account generated successfully',
      account,
    };
  }
}
