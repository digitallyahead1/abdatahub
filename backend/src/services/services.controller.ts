import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get('settings')
  async getServiceSettings() {
    const settings = await this.servicesService.getSettingsForUsers();
    return {
      success: true,
      data: {
        serviceFeeEnabled: settings.serviceFeeEnabled,
        serviceFeeMinAmount: Number(settings.serviceFeeMinAmount),
        serviceFeeMaxAmount: Number(settings.serviceFeeMaxAmount),
        serviceFeeAmount: Number(settings.serviceFeeAmount),
      },
    };
  }

  @Get('notification')
  async getNotification() {
    const settings = await this.servicesService.getSettingsForUsers();
    return {
      success: true,
      data: {
        notificationEnabled: settings.notificationEnabled ?? false,
        notificationMessage: settings.notificationMessage ?? null,
      },
    };
  }

  @Get('electricity/discos')
  async getElectricityDiscos() {
    const data = await this.servicesService.getElectricityDiscos();
    return {
      success: true,
      data,
    };
  }

  @Get('cable/providers')
  async getCableProviders() {
    const data = await this.servicesService.getCableProviders();
    return {
      success: true,
      data,
    };
  }

  @Get('cable/packages')
  async getCablePackages(@Query('service_id') serviceId: string) {
    const data = await this.servicesService.getCablePackages(serviceId);
    return {
      success: true,
      data,
    };
  }

  @Post('verify-customer')
  async verifyCustomer(@Body() body: any) {
    const data = await this.servicesService.verifyCustomer(body);
    return {
      success: true,
      data,
    };
  }

  @Get('data/plans')
  async getDataPlans(@Req() req: any) {
    const data = await this.servicesService.getDataPlans(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Get('airtime/pricing')
  async getAirtimePricing(@Req() req: any) {
    const data = await this.servicesService.getAirtimePricing(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Post('data')
  async purchaseData(@Req() req: any, @Body() body: any) {
    const data = await this.servicesService.purchaseData(req.user.id, body);
    return {
      success: true,
      message: `Data subscription successfully sent to ${body.phoneNumber}`,
      data,
    };
  }

  @Post('airtime')
  async purchaseAirtime(@Req() req: any, @Body() body: any) {
    const data = await this.servicesService.purchaseAirtime(req.user.id, body);
    return {
      success: true,
      message: `Airtime recharge successfully sent to ${body.phoneNumber}`,
      data,
    };
  }

  @Post('electricity')
  async payElectricity(@Req() req: any, @Body() body: any) {
    const data = await this.servicesService.payElectricity(req.user.id, body);
    return {
      success: true,
      message: `Electricity token generated successfully!`,
      data,
    };
  }

  @Post('cable')
  async payCable(@Req() req: any, @Body() body: any) {
    const data = await this.servicesService.payCable(req.user.id, body);
    return {
      success: true,
      message: `Cable TV renewed successfully!`,
      data,
    };
  }

  @Get('electricity/tokens')
  async getElectricityTokens(@Query('meterNumber') meterNumber: string, @Req() req: any) {
    const data = await this.servicesService.getElectricityTokens(req.user.id, meterNumber);
    return {
      success: true,
      data,
    };
  }
}
