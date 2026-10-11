import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { AppointmentsResolver } from './appointments.resolver';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [SharedPrismaModule],
  providers: [AppointmentsService, AppointmentsResolver],
})
export class AppointmentsModule {}
