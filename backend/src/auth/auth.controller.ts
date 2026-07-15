import { Controller, Post, Body, Get, Patch, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: any) {
    const data = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'Account created successfully!',
      data,
    };
  }

  @Post('login')
  async login(@Body() loginDto: any) {
    const data = await this.authService.login(loginDto.email, loginDto.password);
    return {
      success: true,
      message: 'Logged in successfully!',
      data,
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body('refreshToken') token: string) {
    const data = await this.authService.refreshToken(token);
    return {
      success: true,
      data,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const { passwordHash: _, ...userWithoutPassword } = req.user;
    return {
      success: true,
      data: userWithoutPassword,
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() body: any) {
    const data = await this.authService.updateProfile(req.user.id, body);
    return {
      success: true,
      message: 'Profile updated successfully',
      data,
    };
  }

  @Post('reset-pin/send-otp')
  @UseGuards(JwtAuthGuard)
  async sendPinResetOtp(@Req() req: any) {
    return this.authService.sendPinResetOtp(req.user.id);
  }

  @Post('reset-pin/verify')
  @UseGuards(JwtAuthGuard)
  async verifyAndResetPin(
    @Req() req: any,
    @Body('otp') otp: string,
    @Body('newPin') newPin: string,
  ) {
    return this.authService.verifyAndResetPin(req.user.id, otp, newPin);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('verify-otp')
  async verifyOtp(@Body('email') email: string, @Body('otp') otp: string) {
    return this.authService.verifyOtp(email, otp);
  }

  @Post('reset-password')
  async resetPassword(@Body('resetToken') resetToken: string, @Body('password') password: string) {
    return this.authService.resetPassword(resetToken, password);
  }
}
