import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { AvailabilityResolver } from './availability.resolver';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [SharedPrismaModule],
  providers: [AvailabilityService, AvailabilityResolver],
})
export class AvailabilityModule {}
