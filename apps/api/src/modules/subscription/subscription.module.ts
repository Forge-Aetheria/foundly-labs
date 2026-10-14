import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionResolver } from './subscription.resolver';
import { SubscriptionService } from './subscription.service';
import { PrismaSubscriptionStore, SUBSCRIPTION_STORE } from './subscription.store';

@Module({
  imports: [SharedPrismaModule],
  providers: [
    { provide: SUBSCRIPTION_STORE, useClass: PrismaSubscriptionStore },
    SubscriptionService,
    SubscriptionResolver,
    SubscriptionGuard,
  ],
  exports: [SubscriptionService, SubscriptionGuard, SUBSCRIPTION_STORE],
})
export class SubscriptionModule {}
