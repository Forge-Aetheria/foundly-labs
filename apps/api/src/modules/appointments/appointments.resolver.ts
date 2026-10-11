import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AppointmentsService, AppointmentsFilter } from './appointments.service';
import { AppointmentObject, AppointmentStatus, CreateAppointmentInput } from './appointments.types';

@Resolver(() => AppointmentObject)
export class AppointmentsResolver {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Query(() => [AppointmentObject])
  appointments(
    @Args('tenantId', { type: () => String, nullable: true }) tenantId?: string,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string,
    @Args('startDate', { type: () => String, nullable: true }) startDate?: string,
    @Args('endDate', { type: () => String, nullable: true }) endDate?: string,
    @Args('specialistId', { type: () => String, nullable: true }) specialistId?: string,
    @Args('status', { type: () => AppointmentStatus, nullable: true })
    status?: AppointmentStatus,
  ): Promise<AppointmentObject[]> {
    const filter: AppointmentsFilter = {
      tenantId,
      tenantSlug,
      startDate,
      endDate,
      specialistId,
      status,
    };
    return this.appointmentsService.findAppointments(filter);
  }

  @Query(() => AppointmentObject, { nullable: true })
  appointment(@Args('id') id: string): Promise<AppointmentObject | null> {
    return this.appointmentsService.findAppointment(id);
  }

  @Mutation(() => AppointmentObject)
  createAppointment(@Args('input') input: CreateAppointmentInput): Promise<AppointmentObject> {
    return this.appointmentsService.createAppointment(input);
  }

  @Mutation(() => AppointmentObject)
  updateAppointmentStatus(
    @Args('id') id: string,
    @Args('status', { type: () => AppointmentStatus })
    status: AppointmentStatus,
  ): Promise<AppointmentObject> {
    return this.appointmentsService.updateAppointmentStatus(id, status);
  }

  @Mutation(() => AppointmentObject)
  cancelAppointment(
    @Args('id') id: string,
    @Args('reason', { type: () => String, nullable: true }) reason?: string,
  ): Promise<AppointmentObject> {
    return this.appointmentsService.cancelAppointment(id, reason);
  }
}
