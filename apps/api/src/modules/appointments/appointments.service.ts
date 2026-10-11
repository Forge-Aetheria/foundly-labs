import { Injectable } from '@nestjs/common';
import type { Prisma } from '@foundly/database';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  conflictError,
  notFoundError,
  resolveTenantId,
  validationError,
} from '../../shared/tenant-scope';
import { TenantScopeInput } from '../../shared/tenant-scope';
import { AppointmentObject, AppointmentStatus, CreateAppointmentInput } from './appointments.types';

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
} satisfies Prisma.AppointmentInclude;

type AppointmentRow = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_INCLUDE;
}>;

export interface AppointmentsFilter extends TenantScopeInput {
  startDate?: string | null;
  endDate?: string | null;
  specialistId?: string | null;
  status?: AppointmentStatus | string | null;
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

@Injectable()
export class AppointmentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAppointments(filter: AppointmentsFilter): Promise<AppointmentObject[]> {
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
      include: APPOINTMENT_INCLUDE,
      orderBy: [{ startAt: 'asc' }],
    });
    return rows.map((row) => this.toAppointmentObject(row));
  }

  async findAppointment(id: string): Promise<AppointmentObject | null> {
    const row = await this.prismaService.client.appointment.findUnique({
      where: { id },
      include: APPOINTMENT_INCLUDE,
    });
    return row ? this.toAppointmentObject(row) : null;
  }

  async createAppointment(input: CreateAppointmentInput): Promise<AppointmentObject> {
    if (!input.clientName?.trim()) {
      throw validationError('clientName is required');
    }
    const startAt = toDate(input.startAt, 'startAt');
    const endAt = toDate(input.endAt, 'endAt');
    if (endAt <= startAt) {
      throw validationError('endAt must be strictly after startAt');
    }
    const tenantId = await resolveTenantId(this.prismaService.client, input);
    if (tenantId === null) {
      throw notFoundError('Business not found');
    }
    const service = await this.prismaService.client.service.findUnique({
      where: { id: input.serviceId },
      select: {
        id: true,
        tenantId: true,
        durationMinutes: true,
        priceCents: true,
        currency: true,
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

    const data = {
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
      origin: input.origin ?? 'online',
      notes: input.notes ?? null,
    } satisfies Prisma.AppointmentUncheckedCreateInput;

    const created = await this.prismaService.client.appointment.create({
      data,
      include: APPOINTMENT_INCLUDE,
    });
    return this.toAppointmentObject(created);
  }

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus | string,
  ): Promise<AppointmentObject> {
    const next = normalizeStatus(status);
    const existing = await this.prismaService.client.appointment.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw notFoundError('Appointment not found');
    }
    const current = existing.status.toUpperCase();
    const allowed = ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw validationError(`Illegal transition from ${current} to ${next}`);
    }
    const updated = await this.prismaService.client.appointment.update({
      where: { id },
      data: { status: next },
      include: APPOINTMENT_INCLUDE,
    });
    return this.toAppointmentObject(updated);
  }

  async cancelAppointment(id: string, reason?: string | null): Promise<AppointmentObject> {
    const existing = await this.prismaService.client.appointment.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw notFoundError('Appointment not found');
    }
    const current = existing.status.toUpperCase();
    if (!['PENDING', 'CONFIRMED'].includes(current)) {
      throw validationError('Appointment is not cancellable');
    }
    const updated = await this.prismaService.client.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason ?? null,
      },
      include: APPOINTMENT_INCLUDE,
    });
    return this.toAppointmentObject(updated);
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
      service: { id: row.service.id, name: row.service.name },
      specialist: { id: row.specialist.id, name: row.specialist.name },
    };
  }
}
