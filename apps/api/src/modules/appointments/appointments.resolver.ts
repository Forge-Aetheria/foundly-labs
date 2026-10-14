import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { AppointmentsService, AppointmentsFilter } from './appointments.service';
import {
  AppointmentObject,
  AppointmentStatus,
  CreateAppointmentInput,
  PublicAppointmentObject,
  RescheduleAppointmentInput,
} from './appointments.types';

@Resolver(() => AppointmentObject)
export class AppointmentsResolver {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /** Public availability read (minimal projection: no client/payment data). */
  @Query(() => [PublicAppointmentObject])
  appointments(
    @Args('tenantId', { type: () => String, nullable: true }) tenantId?: string,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string,
    @Args('startDate', { type: () => String, nullable: true }) startDate?: string,
    @Args('endDate', { type: () => String, nullable: true }) endDate?: string,
    @Args('specialistId', { type: () => String, nullable: true }) specialistId?: string,
    @Args('status', { type: () => AppointmentStatus, nullable: true })
    status?: AppointmentStatus,
  ): Promise<PublicAppointmentObject[]> {
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

  /** Public availability detail (minimal projection). */
  @Query(() => PublicAppointmentObject, { nullable: true })
  appointment(@Args('id') id: string): Promise<PublicAppointmentObject | null> {
    return this.appointmentsService.findAppointment(id);
  }

  /** Authenticated: the caller's appointments inside an inclusive range. */
  @Query(() => [AppointmentObject])
  @RequireAuth()
  myAppointments(
    @AuthUserDecorator() user: AuthUser,
    @Args('from') from: string,
    @Args('to') to: string,
    @Args('status', { type: () => AppointmentStatus, nullable: true }) status?: AppointmentStatus | null,
    @Args('specialistId', { type: () => ID, nullable: true }) specialistId?: string | null,
  ): ReturnType<AppointmentsService['findMyAppointments']> {
    return this.appointmentsService.findMyAppointments(user, {
      from,
      to,
      status: status ?? null,
      specialistId: specialistId ?? null,
    });
  }

  /** Authenticated: a single appointment of the caller's business. */
  @Query(() => AppointmentObject, { nullable: true })
  @RequireAuth()
  myAppointment(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): ReturnType<AppointmentsService['findMyAppointment']> {
    return this.appointmentsService.findMyAppointment(user, id);
  }

  /** Public booking (online only; the advance is enforced when the service requires it). */
  @Mutation(() => AppointmentObject)
  createAppointment(@Args('input') input: CreateAppointmentInput): Promise<AppointmentObject> {
    return this.appointmentsService.createAppointment(input);
  }

  /** Authenticated manual booking (admin origin; advance-exempt). */
  @Mutation(() => AppointmentObject)
  @RequireAuth()
  createMyAppointment(
    @AuthUserDecorator() user: AuthUser,
    @Args('input') input: CreateAppointmentInput,
  ): ReturnType<AppointmentsService['createMyAppointment']> {
    return this.appointmentsService.createMyAppointment(user, input);
  }

  /** Authenticated: accept/reject/complete an appointment. */
  @Mutation(() => AppointmentObject)
  @RequireAuth()
  updateAppointmentStatus(
    @AuthUserDecorator() user: AuthUser,
    @Args('id') id: string,
    @Args('status', { type: () => AppointmentStatus })
    status: AppointmentStatus,
  ): ReturnType<AppointmentsService['updateAppointmentStatus']> {
    return this.appointmentsService.updateAppointmentStatus(user, id, status);
  }

  /** Authenticated: cancel an appointment. */
  @Mutation(() => AppointmentObject)
  @RequireAuth()
  cancelAppointment(
    @AuthUserDecorator() user: AuthUser,
    @Args('id') id: string,
    @Args('reason', { type: () => String, nullable: true }) reason?: string,
  ): ReturnType<AppointmentsService['cancelAppointment']> {
    return this.appointmentsService.cancelAppointment(user, id, reason);
  }

  /** Authenticated: move an appointment to a free slot. */
  @Mutation(() => AppointmentObject)
  @RequireAuth()
  rescheduleAppointment(
    @AuthUserDecorator() user: AuthUser,
    @Args('input', { type: () => RescheduleAppointmentInput }) input: RescheduleAppointmentInput,
  ): ReturnType<AppointmentsService['rescheduleAppointment']> {
    return this.appointmentsService.rescheduleAppointment(user, input);
  }
}
