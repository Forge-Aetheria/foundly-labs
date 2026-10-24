import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_STORE, PrismaNotificationStore } from './notifications.store';

@Module({
  imports: [SharedPrismaModule],
  providers: [
    { provide: NOTIFICATION_STORE, useClass: PrismaNotificationStore },
    NotificationsService,
    NotificationsResolver,
  ],
  exports: [NotificationsService, NOTIFICATION_STORE],
})
export class NotificationsModule {}
