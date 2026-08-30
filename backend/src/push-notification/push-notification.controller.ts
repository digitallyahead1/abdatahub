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
  @HttpCode(HttpStatus.OK)
  async registerToken(@Request() req: any, @Body() body: any) {
    let userId: string | null = null;
    try {
      const authHeader = req.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenStr = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded: any = jwt.decode(tokenStr);
        if (decoded && (decoded.userId || decoded.sub || decoded.id)) {
          userId = decoded.userId || decoded.sub || decoded.id;
        }
      }
    } catch (_) {}

    const token = body?.token;
    if (!token) {
      return { success: false, message: 'token is required' };
    }
    await this.pushService.registerDeviceToken(
      userId,
      token,
      body?.platform ?? 'android',
      body?.deviceModel,
      body?.appVersion,
    );
    return { success: true, message: 'Device token registered' };
  }

  @Delete('device-token/:token')
  @HttpCode(HttpStatus.OK)
  async removeToken(@Param('token') token: string) {
    await this.pushService.removeDeviceToken(token);
    return { success: true, message: 'Device token removed' };
  }

  // ── Admin: Send Push Notification ───────────────────────────────────────

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendPush(@Request() req: any, @Body() body: any) {
    // Only admins may send broadcasts
    const role: string = req.user?.role ?? '';
    if (!['admin', 'super_admin', 'superadmin', 'owner'].includes(role.toLowerCase())) {
      return { success: false, message: 'Forbidden: admin access required' };
    }

    const title = body?.title?.trim();
    const messageBody = body?.body?.trim();
    if (!title || !messageBody) {
      return { success: false, message: 'title and body are required' };
    }

    const options: SendPushOptions = {
      title,
      body: messageBody,
      imageUrl: body?.imageUrl,
      data: body?.data,
      targetType: body?.targetType || 'all',
      targetValue: body?.targetValue,
      sentBy: req.user?.email,
    };

    try {
      const result = await this.pushService.sendPush(options);
      return {
        success: true,
        message: `Push broadcast completed — ${result.successCount} delivered, ${result.failureCount} failed`,
        data: result,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to dispatch push notification',
      };
    }
  }

  // ── Admin: Notification History ─────────────────────────────────────────

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req: any, @Query('limit') limit?: string) {
    const role: string = req.user?.role ?? '';
    if (!['admin', 'super_admin', 'superadmin', 'owner'].includes(role.toLowerCase())) {
      return { success: false, message: 'Forbidden' };
    }
    try {
      const logs = await this.pushService.getHistory(limit ? parseInt(limit, 10) : 50);
      return { success: true, data: logs };
    } catch (err: any) {
      return { success: true, data: [] };
    }
  }

  // ── Admin: Token Stats ───────────────────────────────────────────────────

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req: any) {
    const role: string = req.user?.role ?? '';
    if (!['admin', 'super_admin', 'superadmin', 'owner'].includes(role.toLowerCase())) {
      return { success: false, message: 'Forbidden' };
    }
    try {
      const activeTokens = await this.pushService.getActiveTokenCount();
      return { success: true, data: { activeTokens } };
    } catch (err: any) {
      return { success: true, data: { activeTokens: 0 } };
    }
  }

  // ── Admin: List Device Tokens ────────────────────────────────────────────

  @Get('tokens')
  @UseGuards(JwtAuthGuard)
  async listTokens(@Request() req: any) {
    const role: string = req.user?.role ?? '';
    if (!['admin', 'super_admin', 'superadmin', 'owner'].includes(role.toLowerCase())) {
      return { success: false, message: 'Forbidden' };
    }
    try {
      const tokens = await this.pushService.listActiveTokens();
      return { success: true, count: tokens.length, data: tokens };
    } catch (err: any) {
      return { success: false, message: err?.message };
    }
  }

  // ── Admin: Clear All Stale Tokens ────────────────────────────────────────

  @Post('clear-stale-tokens')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async clearStaleTokens(@Request() req: any) {
    const role: string = req.user?.role ?? '';
    if (!['admin', 'super_admin', 'superadmin', 'owner'].includes(role.toLowerCase())) {
      return { success: false, message: 'Forbidden' };
    }
    try {
      const result = await this.pushService.clearAllTokens();
      return { success: true, message: `Cleared ${result.cleared} device tokens. Users will re-register on next app open.`, data: result };
    } catch (err: any) {
      return { success: false, message: err?.message };
    }
  }

  // ── Admin: Send Test to Single FCM Token ────────────────────────────────

  @Post('test-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async testSingleToken(@Request() req: any, @Body() body: any) {
    const role: string = req.user?.role ?? '';
    if (!['admin', 'super_admin', 'superadmin', 'owner'].includes(role.toLowerCase())) {
      return { success: false, message: 'Forbidden' };
    }
    const { fcmToken, title = 'Test', body: msgBody = 'Test notification' } = body || {};
    if (!fcmToken) {
      return { success: false, message: 'fcmToken is required' };
    }
    const result = await this.pushService.sendTestToSingleToken(fcmToken, title, msgBody);
    return { success: result.success, data: result };
  }
}
