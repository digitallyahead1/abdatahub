import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
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
