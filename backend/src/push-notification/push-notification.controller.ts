import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsIn } from 'class-validator';
import { PushNotificationService, SendPushOptions } from './push-notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// ── DTOs ────────────────────────────────────────────────────────────────────

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsString()
  @IsOptional()
  appVersion?: string;
}

export class SendPushDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, string>;

  @IsString()
  @IsIn(['all', 'agents', 'user'])
  targetType: 'all' | 'agents' | 'user';

  @IsString()
  @IsOptional()
  targetValue?: string;
}


@Controller('notifications')
export class PushNotificationController {
  constructor(private readonly pushService: PushNotificationService) {}

  // ── Device Token (called from mobile app) ───────────────────────────────

  @Post('device-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async registerToken(@Request() req: any, @Body() dto: RegisterTokenDto) {
    const userId: string = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    await this.pushService.registerDeviceToken(
      userId,
      dto.token,
      dto.platform ?? 'android',
      dto.deviceModel,
      dto.appVersion,
    );
    return { success: true, message: 'Device token registered' };
  }

  @Delete('device-token/:token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeToken(@Param('token') token: string) {
    await this.pushService.removeDeviceToken(token);
    return { success: true, message: 'Device token removed' };
  }

  // ── Admin: Send Push Notification ───────────────────────────────────────

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendPush(@Request() req: any, @Body() dto: SendPushDto) {
    // Only admins may send broadcasts
    const role: string = req.user?.role ?? '';
    if (!['admin', 'superadmin'].includes(role)) {
      return { success: false, message: 'Forbidden: admin access required' };
    }

    const options: SendPushOptions = {
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl,
      data: dto.data,
      targetType: dto.targetType,
      targetValue: dto.targetValue,
      sentBy: req.user?.email,
    };

    const result = await this.pushService.sendPush(options);
    return {
      success: true,
      message: `Push sent — ${result.successCount} delivered, ${result.failureCount} failed`,
      data: result,
    };
  }

  // ── Admin: Notification History ─────────────────────────────────────────

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req: any, @Query('limit') limit?: string) {
    const role: string = req.user?.role ?? '';
    if (!['admin', 'superadmin'].includes(role)) {
      return { success: false, message: 'Forbidden' };
    }
    const logs = await this.pushService.getHistory(limit ? parseInt(limit, 10) : 50);
    return { success: true, data: logs };
  }

  // ── Admin: Token Stats ───────────────────────────────────────────────────

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req: any) {
    const role: string = req.user?.role ?? '';
    if (!['admin', 'superadmin'].includes(role)) {
      return { success: false, message: 'Forbidden' };
    }
    const activeTokens = await this.pushService.getActiveTokenCount();
    return { success: true, data: { activeTokens } };
  }
}
