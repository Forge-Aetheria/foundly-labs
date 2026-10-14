import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ServicesResolver } from './services.resolver';
import { ServicesService } from './services.service';

@Module({
  imports: [SharedPrismaModule, SubscriptionModule],
  providers: [ServicesService, ServicesResolver],
})
export class ServicesModule {}
