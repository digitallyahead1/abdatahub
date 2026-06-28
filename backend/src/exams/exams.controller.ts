import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  // User Actions
  @Get('services/exams/pricing')
  async getUserPricing() {
    const data = await this.examsService.getUserPricing();
    return {
      success: true,
      data,
    };
  }

  @Get('services/exams/my-pins')
  async getUserPurchases(@Req() req: any) {
    const data = await this.examsService.getUserPurchases(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Post('services/exam-pin')
  async purchaseExamPin(@Req() req: any, @Body() body: any) {
    const data = await this.examsService.purchasePins(req.user.id, body);
    return {
      success: true,
      message: `${body.quantity} exam result checker pins purchased successfully!`,
      data,
    };
  }

  // Admin Actions (Guarded by PermissionsGuard)
  @Get('admin/exams/stats')
  @UseGuards(PermissionsGuard)
  @Permissions('manage:settings')
  async getAdminStats() {
    const data = await this.examsService.getAdminStats();
    return {
      success: true,
      data,
    };
  }

  @Post('admin/exams/upload')
  @UseGuards(PermissionsGuard)
  @Permissions('manage:settings')
  async uploadPins(@Body() body: any, @Req() req: any) {
    const { examType, pins, serials } = body;
    const data = await this.examsService.uploadPins(examType, pins, serials, req.user);
    return {
      success: true,
      message: 'Exam PINs uploaded successfully!',
      data,
    };
  }

  @Post('admin/exams/pricing')
  @UseGuards(PermissionsGuard)
  @Permissions('manage:settings')
  async updatePricing(@Body() body: any, @Req() req: any) {
    const data = await this.examsService.updatePricing(body, req.user);
    return {
      success: true,
      message: 'Exam PIN pricing updated successfully!',
      data,
    };
  }

  @Get('admin/exams/inventory')
  @UseGuards(PermissionsGuard)
  @Permissions('manage:settings')
  async getInventory(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('examType') examType: string,
    @Query('status') status: string,
  ) {
    const data = await this.examsService.getInventory(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 100,
      examType || undefined,
      status || undefined,
    );
    return {
      success: true,
      data,
    };
  }

  @Post('admin/exams/pins/:id/toggle')
  @UseGuards(PermissionsGuard)
  @Permissions('manage:settings')
  async togglePin(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    const data = await this.examsService.togglePin(id, status, req.user);
    return {
      success: true,
      message: `PIN status changed to ${status}`,
      data,
    };
  }

  @Delete('admin/exams/pins/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('manage:settings')
  async deletePin(@Param('id') id: string, @Req() req: any) {
    const data = await this.examsService.deletePin(id, req.user);
    return {
      success: true,
      message: 'Exam PIN record deleted successfully',
      data,
    };
  }
}
