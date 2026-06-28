import { Controller, Get, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('referrals')
  async getReferrals(@Req() req: any) {
    const data = await this.usersService.getReferrals(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Post('transaction-pin')
  async setTransactionPin(@Req() req: any, @Body() body: any) {
    const { pin } = body;
    if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
      throw new BadRequestException('Transaction pin must be a 4-digit number');
    }
    const updatedUser = await this.usersService.setTransactionPin(req.user.id, pin);
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return {
      success: true,
      message: 'Transaction pin set successfully!',
      data: userWithoutPassword,
    };
  }
}
