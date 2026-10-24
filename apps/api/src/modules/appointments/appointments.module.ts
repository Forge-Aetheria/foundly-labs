import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsResolver } from './appointments.resolver';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [SharedPrismaModule, NotificationsModule],
  providers: [AppointmentsService, AppointmentsResolver],
})
export class AppointmentsModule {}
