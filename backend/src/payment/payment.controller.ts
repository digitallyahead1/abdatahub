import { Controller, Get, Post, UseGuards, Req, Body, BadRequestException } from '@nestjs/common';
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
  async generateGafiapayAccount(
    @Req() req: any,
    @Body() body: { nin?: string; bvn?: string; idNumber?: string; idType?: 'nin' | 'bvn' | 'auto' },
  ) {
    const nin = body?.nin ? String(body.nin).trim() : '';
    const bvn = body?.bvn ? String(body.bvn).trim() : '';
    const rawId = body?.idNumber ? String(body.idNumber).trim() : '';

    const idType: 'nin' | 'bvn' | 'auto' = body?.idType 
      ? body.idType 
      : (bvn && !nin ? 'bvn' : nin && !bvn ? 'nin' : 'auto');

    const idToUse = rawId || (idType === 'bvn' ? (bvn || nin) : (nin || bvn));

    if (!idToUse || !/^\d{11}$/.test(idToUse)) {
      throw new BadRequestException('Please provide a valid 11-digit NIN or BVN for PalmPay virtual account verification.');
    }

    const account = await this.paymentService.generateGafiapayAccount(
      req.user.id,
      req.user.email,
      req.user.fullName,
      idToUse,
      idType,
    );
    return {
      success: true,
      message: 'PalmPay permanent virtual account generated successfully',
      account,
    };
  }
}
