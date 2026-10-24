import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_STORE, PrismaNotificationStore } from './notifications.store';
import { PUSH_TOKEN_STORE, PrismaPushTokenStore } from './push-tokens.store';
import { PushTokensService } from './push-tokens.service';
import { PushTokensResolver } from './push-tokens.resolver';
import { ExpoPushService } from './expo-push.service';

@Module({
  imports: [SharedPrismaModule],
  providers: [
    { provide: NOTIFICATION_STORE, useClass: PrismaNotificationStore },
    { provide: PUSH_TOKEN_STORE, useClass: PrismaPushTokenStore },
    NotificationsService,
    NotificationsResolver,
    PushTokensService,
    PushTokensResolver,
    ExpoPushService,
  ],
  exports: [NotificationsService, NOTIFICATION_STORE, ExpoPushService],
})
export class NotificationsModule {}
