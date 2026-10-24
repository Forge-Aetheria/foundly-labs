import { Injectable, Logger, Optional } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import type { Prisma } from '@foundly/database';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  conflictError,
  notFoundError,
  resolveTenantId,
  validationError,
} from '../../shared/tenant-scope';
import { TenantScopeInput } from '../../shared/tenant-scope';
import type { AuthUser } from '../auth/jwt.types';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentMethodType } from '../payments/payments.types';
import {
  AppointmentNotificationObject,
  AppointmentObject,
  AppointmentStatus,
  CreateAppointmentInput,
  PublicAppointmentObject,
  RescheduleAppointmentInput,
} from './appointments.types';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
  CONFIRMED: ['CANCELLED', 'COMPLETED'],
  CANCELLED: [],
  COMPLETED: [],
};

const APPOINTMENT_INCLUDE = {
  service: {
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      priceCents: true,
      currency: true,
    },
  },
  specialist: { select: { id: true, name: true } },
  notifications: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.AppointmentInclude;

type AppointmentRow = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_INCLUDE;
}>;

type AppointmentNotificationRow = AppointmentRow['notifications'][number];

const NOTIFICATION_MESSAGES: Record<string, string> = {
  CONFIRMED: 'Tu cita fue confirmada.',
  CANCELLED: 'Tu cita fue cancelada.',
};

export interface AppointmentsFilter extends TenantScopeInput {
  startDate?: string | null;
  endDate?: string | null;
  specialistId?: string | null;
  status?: AppointmentStatus | string | null;
}

export interface MyAppointmentsFilter {
  from: string;
  to: string;
  specialistId?: string | null;
  status?: AppointmentStatus | string | null;
}

function scopeError(): GraphQLError {
  return new GraphQLError('Missing tenant scope', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

function normalizeStatus(value: string): string {
  const normalized = value.toUpperCase();
  if (!Object.values(AppointmentStatus).includes(normalized as AppointmentStatus)) {
    throw validationError('Invalid appointment status');
  }
  return normalized;
}

function toDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw validationError(`${field} must be a valid ISO date`);
  }
  return date;
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  /** Resolve the authoritative tenant scope from the authenticated identity (never client input). */
  requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw scopeError();
    }
    return user.tenantId;
  }

  /** Public availability read: minimal projection (no client/payment data). */
  async findAppointments(filter: AppointmentsFilter): Promise<PublicAppointmentObject[]> {
    const tenantId = await resolveTenantId(this.prismaService.client, filter);
    if (tenantId === null) {
      return [];
    }
    const startFilter: Prisma.DateTimeFilter = {
      ...(filter.startDate != null ? { gte: toDate(filter.startDate, 'startDate') } : {}),
      ...(filter.endDate != null ? { lte: toDate(filter.endDate, 'endDate') } : {}),
    };
    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      ...(filter.specialistId != null ? { specialistId: filter.specialistId } : {}),
      ...(filter.status != null ? { status: normalizeStatus(filter.status) } : {}),
      ...(Object.keys(startFilter).length > 0 ? { startAt: startFilter } : {}),
    };
    const rows = await this.prismaService.client.appointment.findMany({
      where,
      orderBy: [{ startAt: 'asc' }],
    });
    return rows.map((row) => this.toPublicAppointment(row));
  }

  /** Public availability detail: minimal projection. */
  async findAppointment(id: string): Promise<PublicAppointmentObject | null> {
    const row = await this.prismaService.client.appointment.findUnique({ where: { id } });
    return row ? this.toPublicAppointment(row) : null;
  }

  /** Authenticated agenda read: the caller's appointments inside an inclusive range. */
  async findMyAppointments(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    filter: MyAppointmentsFilter,
  ): Promise<AppointmentObject[]> {
    const tenantId = this.requireTenant(user);
    const from = toDate(filter.from, 'from');
    const to = toDate(filter.to, 'to');
    if (to < from) {
      throw validationError('to must not be before from');
    }
    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      startAt: { gte: from, lte: to },
      ...(filter.specialistId != null ? { specialistId: filter.specialistId } : {}),
      ...(filter.status != null ? { status: normalizeStatus(filter.status) } : {}),
    };
    const rows = await this.prismaService.client.appointment.findMany({
      where,
      include: APPOINTMENT_INCLUDE,
      orderBy: [{ startAt: 'asc' }],
    });
    return rows.map((row) => this.toAppointmentObject(row));
  }

  /** Authenticated: a single appointment of the caller's business (foreign → null). */
  async findMyAppointment(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    id: string,
  ): Promise<AppointmentObject | null> {
    const tenantId = this.requireTenant(user);
    const row = await this.prismaService.client.appointment.findFirst({
      where: { id, tenantId },
      include: APPOINTMENT_INCLUDE,
    });
    return row ? this.toAppointmentObject(row) : null;
  }

  /** Public booking: forces `online` origin and enforces the service advance rule. */
  async createAppointment(input: CreateAppointmentInput): Promise<AppointmentObject> {
    const tenantId = await resolveTenantId(this.prismaService.client, input);
    if (tenantId === null) {
      throw notFoundError('Business not found');
    }
    return this.createForTenant(tenantId, input, 'online', true);
  }

  /** Authenticated manual booking: `admin` origin, exempt from the advance rule. */
  async createMyAppointment(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    input: CreateAppointmentInput,
  ): Promise<AppointmentObject> {
    const tenantId = this.requireTenant(user);
    return this.createForTenant(tenantId, input, 'admin', false);
  }

  /** Authenticated: accept/reject/complete through the allowed transition matrix (idempotent). */
  async updateAppointmentStatus(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    id: string,
    status: AppointmentStatus | string,
  ): Promise<AppointmentObject> {
    const tenantId = this.requireTenant(user);
    const next = normalizeStatus(status);
    const existing = await this.prismaService.client.appointment.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw notFoundError('Appointment not found');
    }
    const current = existing.status.toUpperCase();
    if (current === next) {
      return this.getOwnedRow(id, tenantId);
    }
    const allowed = ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw validationError(`Illegal transition from ${current} to ${next}`);
    }
    await this.prismaService.client.appointment.update({
      where: { id },
      data: { status: next },
    });
    await this.recordNotification(id, tenantId, 'status_change', this.statusMessage(next));
    return this.getOwnedRow(id, tenantId);
  }

  /** Authenticated: cancel a pending/confirmed appointment (records a notification). */
  async cancelAppointment(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    id: string,
    reason?: string | null,
  ): Promise<AppointmentObject> {
    const tenantId = this.requireTenant(user);
    const existing = await this.prismaService.client.appointment.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw notFoundError('Appointment not found');
    }
    const current = existing.status.toUpperCase();
    if (!['PENDING', 'CONFIRMED'].includes(current)) {
      throw validationError('Appointment is not cancellable');
    }
    await this.prismaService.client.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason ?? null,
      },
    });
    await this.recordNotification(
      id,
      tenantId,
      'status_change',
      NOTIFICATION_MESSAGES.CANCELLED ?? 'Tu cita fue cancelada.',
    );
    return this.getOwnedRow(id, tenantId);
  }

  /** Authenticated: move an appointment to a free slot (records a notification). */
  async rescheduleAppointment(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    input: RescheduleAppointmentInput,
  ): Promise<AppointmentObject> {
    const tenantId = this.requireTenant(user);
    const existing = await this.prismaService.client.appointment.findFirst({
      where: { id: input.id, tenantId },
      select: { id: true, status: true, appliedDurationMinutes: true, specialistId: true },
    });
    if (!existing) {
      throw notFoundError('Appointment not found');
    }
    const current = existing.status.toUpperCase();
    if (!['PENDING', 'CONFIRMED'].includes(current)) {
      throw validationError('Appointment cannot be rescheduled');
    }
    const startAt = toDate(input.startAt, 'startAt');
    const endAt = new Date(startAt.getTime() + existing.appliedDurationMinutes * 60_000);
    if (endAt <= startAt) {
      throw validationError('endAt must be strictly after startAt');
    }
    const specialistId = input.specialistId ?? existing.specialistId;
    if (specialistId !== existing.specialistId) {
      const specialist = await this.prismaService.client.specialist.findUnique({
        where: { id: specialistId },
        select: { id: true, tenantId: true },
      });
      if (!specialist || specialist.tenantId !== tenantId) {
        throw notFoundError('Specialist not found');
      }
    }
    const overlaps = await this.prismaService.client.appointment.findMany({
      where: {
        tenantId,
        specialistId,
        id: { not: input.id },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        status: { not: 'CANCELLED' },
      },
      select: { id: true },
    });
    if (overlaps.length > 0) {
      throw conflictError('Slot overlaps an existing appointment');
    }
    await this.prismaService.client.appointment.update({
      where: { id: input.id },
      data: { startAt, endAt, specialistId },
    });
    await this.recordNotification(input.id, tenantId, 'reschedule', 'Tu cita fue reprogramada.');
    return this.getOwnedRow(input.id, tenantId);
  }

  private async createForTenant(
    tenantId: string,
    input: CreateAppointmentInput,
    origin: 'online' | 'admin',
    enforceAdvance: boolean,
  ): Promise<AppointmentObject> {
    if (!input.clientName?.trim()) {
      throw validationError('clientName is required');
    }
    const startAt = toDate(input.startAt, 'startAt');
    const endAt = toDate(input.endAt, 'endAt');
    if (endAt <= startAt) {
      throw validationError('endAt must be strictly after startAt');
    }
    const service = await this.prismaService.client.service.findUnique({
      where: { id: input.serviceId },
      select: {
        id: true,
        name: true,
        tenantId: true,
        durationMinutes: true,
        priceCents: true,
        currency: true,
        requiresAdvance: true,
        advanceKind: true,
        advanceValue: true,
      },
    });
    if (!service || service.tenantId !== tenantId) {
      throw notFoundError('Service not found');
    }
    const specialist = await this.prismaService.client.specialist.findUnique({
      where: { id: input.specialistId },
      select: { id: true, tenantId: true },
    });
    if (!specialist || specialist.tenantId !== tenantId) {
      throw notFoundError('Specialist not found');
    }

    const overlaps = await this.prismaService.client.appointment.findMany({
      where: {
        tenantId,
        specialistId: input.specialistId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        status: { not: 'CANCELLED' },
      },
      select: { id: true },
    });
    if (overlaps.length > 0) {
      throw conflictError('Slot overlaps an existing appointment');
    }

    const payment = enforceAdvance && service.requiresAdvance
      ? await this.resolveAdvance(tenantId, service, input)
      : null;

    const created = await this.prismaService.client.appointment.create({
      data: {
        tenantId,
        specialistId: input.specialistId,
        serviceId: input.serviceId,
        clientName: input.clientName.trim(),
        clientContact: input.clientContact ?? null,
        startAt,
        endAt,
        status: 'PENDING',
        appliedDurationMinutes: service.durationMinutes,
        appliedAmountCents: service.priceCents,
        appliedCurrency: service.currency,
        origin,
        notes: input.notes ?? null,
        paymentMethodType: payment?.paymentMethodType ?? null,
        advanceAmountCents: payment?.advanceAmountCents ?? null,
        paymentReference: payment?.paymentReference ?? null,
        paymentProofUrl: payment?.paymentProofUrl ?? null,
        paymentSubmittedAt: payment?.paymentSubmittedAt ?? null,
      },
      include: APPOINTMENT_INCLUDE,
    });

    if (origin === 'online') {
      try {
        await this.notifications?.notifyNewOnlineBooking({
          tenantId,
          serviceName: service.name,
          clientName: input.clientName.trim(),
          startAt,
        });
      } catch (error) {
        // Best-effort: the notification must never fail a valid booking.
        this.logger.warn(
          `Failed to create new-booking notification for tenant ${tenantId}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }

    return this.toAppointmentObject(created);
  }

  /** Validate and normalize the submitted advance against the service rule. */
  private async resolveAdvance(
    tenantId: string,
    service: {
      priceCents: number;
      advanceKind: string | null;
      advanceValue: number | null;
    },
    input: CreateAppointmentInput,
  ): Promise<{
    paymentMethodType: PaymentMethodType;
    advanceAmountCents: number;
    paymentReference: string;
    paymentProofUrl: string;
    paymentSubmittedAt: Date;
  }> {
    const methodType = input.paymentMethodType;
    if (!methodType || !Object.values(PaymentMethodType).includes(methodType)) {
      throw validationError('A valid paymentMethodType is required for an advance');
    }
    const reference = input.paymentReference?.trim() ?? '';
    if (!reference) {
      throw validationError('paymentReference is required for an advance');
    }
    const proofUrl = input.paymentProofUrl?.trim() ?? '';
    if (!proofUrl || !isAbsoluteHttpUrl(proofUrl)) {
      throw validationError('paymentProofUrl must be an absolute http(s) URL');
    }
    const activeMethod = await this.prismaService.client.paymentMethod.findFirst({
      where: { tenantId, type: methodType, active: true },
      select: { id: true },
    });
    if (!activeMethod) {
      throw validationError('The selected payment method is not available');
    }
    const expected = this.expectedAdvance(service);
    if (expected === null) {
      throw validationError('This service requires an advance but has no valid rule configured');
    }
    if (input.advanceAmountCents !== expected) {
      throw validationError('The advance amount does not match the required amount');
    }
    return {
      paymentMethodType: methodType,
      advanceAmountCents: expected,
      paymentReference: reference,
      paymentProofUrl: proofUrl,
      paymentSubmittedAt: new Date(),
    };
  }

  private expectedAdvance(service: {
    priceCents: number;
    advanceKind: string | null;
    advanceValue: number | null;
  }): number | null {
    if (service.advanceValue == null || service.advanceValue < 1) {
      return null;
    }
    if (service.advanceKind === 'fixed') {
      return service.advanceValue;
    }
    if (service.advanceKind === 'percent') {
      const computed = Math.round((service.priceCents * service.advanceValue) / 100);
      return computed > 0 ? computed : null;
    }
    return null;
  }

  private statusMessage(status: string): string {
    return NOTIFICATION_MESSAGES[status] ?? 'Tu cita cambió de estado.';
  }

  private async recordNotification(
    appointmentId: string,
    tenantId: string,
    kind: string,
    message: string,
  ): Promise<void> {
    await this.prismaService.client.appointmentNotification.create({
      data: { appointmentId, tenantId, kind, message },
    });
  }

  private async getOwnedRow(id: string, tenantId: string): Promise<AppointmentObject> {
    const row = await this.prismaService.client.appointment.findFirst({
      where: { id, tenantId },
      include: APPOINTMENT_INCLUDE,
    });
    if (!row) {
      throw notFoundError('Appointment not found');
    }
    return this.toAppointmentObject(row);
  }

  private toPublicAppointment(row: {
    id: string;
    specialistId: string;
    startAt: Date;
    endAt: Date;
    status: string;
  }): PublicAppointmentObject {
    return {
      id: row.id,
      specialistId: row.specialistId,
      startAt: row.startAt,
      endAt: row.endAt,
      status: row.status.toUpperCase() as AppointmentStatus,
    };
  }

  private toNotificationObject(row: AppointmentNotificationRow): AppointmentNotificationObject {
    return {
      id: row.id,
      kind: row.kind,
      message: row.message,
      channel: row.channel,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toAppointmentObject(row: AppointmentRow): AppointmentObject {
    return {
      id: row.id,
      tenantId: row.tenantId,
      serviceId: row.serviceId,
      specialistId: row.specialistId,
      clientName: row.clientName,
      clientContact: row.clientContact ?? null,
      startAt: row.startAt,
      endAt: row.endAt,
      status: row.status.toUpperCase() as AppointmentStatus,
      appliedDurationMinutes: row.appliedDurationMinutes,
      appliedAmountCents: row.appliedAmountCents,
      appliedCurrency: row.appliedCurrency,
      origin: row.origin,
      notes: row.notes ?? null,
      cancellationReason: row.cancellationReason ?? null,
      paymentMethodType: row.paymentMethodType ?? null,
      advanceAmountCents: row.advanceAmountCents ?? null,
      paymentReference: row.paymentReference ?? null,
      paymentProofUrl: row.paymentProofUrl ?? null,
      paymentSubmittedAt: row.paymentSubmittedAt ? row.paymentSubmittedAt.toISOString() : null,
      notifications: row.notifications.map((notification) => this.toNotificationObject(notification)),
      service: { id: row.service.id, name: row.service.name },
      specialist: { id: row.specialist.id, name: row.specialist.name },
    };
  }
}
