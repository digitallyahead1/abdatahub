import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushNotificationService } from './push-notification.service';
import { PushNotificationController } from './push-notification.controller';
import { DeviceToken } from '../entities/device-token.entity';
import { PushNotificationLog } from '../entities/push-notification-log.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken, PushNotificationLog, User])],
  providers: [PushNotificationService],
  controllers: [PushNotificationController],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}
