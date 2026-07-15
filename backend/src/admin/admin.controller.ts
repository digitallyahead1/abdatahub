import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard-stats')
  @Permissions('view:dashboard')
  async getStats() {
    const data = await this.adminService.getDashboardStats();
    return {
      success: true,
      data,
    };
  }

  @Get('users')
  @Permissions('manage:users')
  async getUsers() {
    const data = await this.adminService.getUsers();
    return {
      success: true,
      data,
    };
  }

  @Post('users/:id/status')
  @Permissions('manage:users')
  async updateUserStatus(
    @Param('id') userId: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    const data = await this.adminService.updateUserStatus(userId, status, req.user);
    return {
      success: true,
      message: `User status changed to ${status}`,
      data,
    };
  }

  @Post('users/:id/verify')
  @Permissions('manage:users')
  async updateUserVerification(
    @Param('id') userId: string,
    @Body('field') field: 'emailVerified' | 'phoneVerified',
    @Body('value') value: boolean,
    @Req() req: any,
  ) {
    const data = await this.adminService.updateUserVerification(userId, field, value, req.user);
    return {
      success: true,
      message: `User verification updated!`,
      data,
    };
  }

  @Post('users/role-otp')
  @Permissions('manage:users')
  async sendRoleOtp(@Req() req: any) {
    const data = await this.adminService.sendRoleOtp(req.user);
    return {
      success: true,
      message: 'OTP sent to your email address for role change verification.',
      data,
    };
  }

  @Post('users/:id/role-permissions')
  @Permissions('manage:users')
  async updateUserRoleAndPermissions(
    @Param('id') userId: string,
    @Body('role') role: string,
    @Body('permissions') permissions: string[],
    @Body('otp') otp: string,
    @Req() req: any,
  ) {
    const data = await this.adminService.updateUserRoleAndPermissions(
      userId,
      role,
      permissions,
      req.user,
      otp,
    );
    return {
      success: true,
      message: 'User role and permissions updated successfully!',
      data,
    };
  }

  @Delete('users/:id')
  @Permissions('manage:users')
  async deleteUser(@Param('id') userId: string, @Req() req: any) {
    const data = await this.adminService.deleteUser(userId, req.user);
    return {
      success: true,
      message: 'User deleted successfully',
      data,
    };
  }

  @Get('transactions')
  @Permissions('manage:transactions')
  async getTransactions() {
    const data = await this.adminService.getTransactions();
    return {
      success: true,
      data,
    };
  }

  @Post('transactions/:id/success')
  @Permissions('manage:transactions')
  async makeTransactionSuccessful(@Param('id') transactionId: string, @Req() req: any) {
    const data = await this.adminService.makeTransactionSuccessful(transactionId, req.user);
    return {
      success: true,
      message: 'Transaction status updated to success',
      data,
    };
  }

  @Post('transactions/:id/requery')
  @Permissions('manage:transactions')
  async requeryTransaction(@Param('id') transactionId: string, @Req() req: any) {
    const data = await this.adminService.requeryTransaction(transactionId, req.user);
    return {
      success: true,
      message: 'Transaction status requery complete',
      data,
    };
  }

  @Post('transactions/:id/refund')
  @Permissions('manage:transactions')
  async refundTransaction(@Param('id') transactionId: string, @Req() req: any) {
    const data = await this.adminService.refundTransaction(transactionId, req.user);
    return {
      success: true,
      message: 'Transaction successfully refunded',
      data,
    };
  }

  @Post('wallet/adjust')
  @Permissions('manage:wallet')
  async adjustWallet(@Body() body: any, @Req() req: any) {
    const data = await this.adminService.adjustWallet(body, req.user);
    return {
      success: true,
      message: 'Wallet adjustment processed successfully!',
      data,
    };
  }

  @Get('settings')
  @Permissions('manage:settings')
  async getSettings() {
    const data = await this.adminService.getSettings();
    return {
      success: true,
      data,
    };
  }

  @Post('settings')
  @Permissions('manage:settings')
  async updateSettings(@Body() body: any, @Req() req: any) {
    const data = await this.adminService.updateSettings(body, req.user);
    return {
      success: true,
      message: 'System settings successfully updated!',
      data,
    };
  }

  @Get('audit-logs')
  @Permissions('manage:settings')
  async getAuditLogs() {
    const data = await this.adminService.getAuditLogs();
    return {
      success: true,
      data,
    };
  }

  @Get('smeplug/sync-logs')
  @Permissions('manage:settings')
  async getSyncLogs() {
    const data = await this.adminService.getSyncLogs();
    return {
      success: true,
      data,
    };
  }

  @Post('smeplug/sync')
  @Permissions('manage:settings')
  async triggerSync(@Req() req: any) {
    const data = await this.adminService.triggerSync(req.user);
    return {
      success: true,
      message: 'SMEPlug plans synchronization complete!',
      data,
    };
  }

  @Get('data-plans')
  @Permissions('manage:settings')
  async getDataPlans() {
    const data = await this.adminService.getDataPlans();
    return {
      success: true,
      data,
    };
  }

  @Put('data-plans/:id')
  @Permissions('manage:settings')
  async updateDataPlan(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const data = await this.adminService.updateDataPlan(id, body, req.user);
    return {
      success: true,
      message: 'Data plan configuration updated successfully!',
      data,
    };
  }

  @Get('airtime-pricing')
  @Permissions('manage:settings')
  async getAirtimePricing() {
    const data = await this.adminService.getAirtimePricing();
    return {
      success: true,
      data,
    };
  }

  @Put('airtime-pricing/:network')
  @Permissions('manage:settings')
  async updateAirtimePricing(
    @Param('network') network: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const data = await this.adminService.updateAirtimePricing(network, body, req.user);
    return {
      success: true,
      message: 'Airtime rate configuration updated successfully!',
      data,
    };
  }

  @Get('reports')
  @Permissions('view:dashboard')
  async getReports(@Query() query: any) {
    const data = await this.adminService.getReports(query);
    return {
      success: true,
      data,
    };
  }
}
