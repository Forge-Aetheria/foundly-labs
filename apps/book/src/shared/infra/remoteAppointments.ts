import { apiRequest } from './apiClient';
import type { ActionResult } from './result';
import type { Appointment } from '../types/appointments';

/**
 * Remote appointments repository (feature 010 — remove local store).
 * Public query/mutations per `appointments.resolver.ts`.
 */

export type AppointmentStatusDto = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface AppointmentDto {
  id: string;
  tenantId: string;
  serviceId: string;
  specialistId: string;
  clientName: string;
  clientContact: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatusDto;
  appliedDurationMinutes: number;
  appliedAmountCents: number;
  appliedCurrency: string;
  origin: string;
  notes: string | null;
  cancellationReason: string | null;
  service: { id: string; name: string };
  specialist: { id: string; name: string };
}

export interface AppointmentFilter {
  tenantId?: string | null;
  tenantSlug?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  specialistId?: string | null;
  status?: AppointmentStatusDto | null;
}

export interface CreateAppointmentInput {
  tenantId?: string | null;
  tenantSlug?: string | null;
  serviceId: string;
  specialistId: string;
  clientName: string;
  clientContact?: string | null;
  startAt: string;
  endAt: string;
  origin?: string | null;
  notes?: string | null;
}

/** API status (`PENDING`…) → domain status (`pending`…). */
export function mapAppointmentStatus(status: AppointmentStatusDto): Appointment['status'] {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'CONFIRMED':
      return 'confirmed';
    case 'CANCELLED':
      return 'cancelled';
    case 'COMPLETED':
      return 'completed';
  }
}

/**
 * API `AppointmentDto` → domain `Appointment`.
 * `resourceId` maps from `specialistId`; `createdAt`/`updatedAt` are not served
 * by the API surface, so they fall back to `startAt` (data-model known gap).
 */
export function mapAppointmentDto(dto: AppointmentDto): Appointment {
  return {
    id: dto.id,
    resourceId: dto.specialistId,
    serviceId: dto.serviceId,
    clientName: dto.clientName,
    clientContact: dto.clientContact ?? null,
    startAt: dto.startAt,
    endAt: dto.endAt,
    status: mapAppointmentStatus(dto.status),
    notes: dto.notes ?? null,
    appliedDurationMinutes: dto.appliedDurationMinutes,
    appliedAmountCents: dto.appliedAmountCents,
    appliedCurrency: dto.appliedCurrency,
    origin: dto.origin === 'admin' ? 'admin' : 'online',
    cancellationReason: dto.cancellationReason ?? null,
    createdAt: dto.startAt,
    updatedAt: dto.startAt,
  };
}

const APPOINTMENT_FIELDS = /* GraphQL */ `
  id
  tenantId
  serviceId
  specialistId
  clientName
  clientContact
  startAt
  endAt
  status
  appliedDurationMinutes
  appliedAmountCents
  appliedCurrency
  origin
  notes
  cancellationReason
  service {
    id
    name
  }
  specialist {
    id
    name
  }
`;

const LIST_APPOINTMENTS = /* GraphQL */ `
  query Appointments(
    $tenantId: String
    $tenantSlug: String
    $startDate: String
    $endDate: String
    $specialistId: String
    $status: AppointmentStatus
  ) {
    appointments(
      tenantId: $tenantId
      tenantSlug: $tenantSlug
      startDate: $startDate
      endDate: $endDate
      specialistId: $specialistId
      status: $status
    ) {
      ${APPOINTMENT_FIELDS}
    }
  }
`;

const APPOINTMENT = /* GraphQL */ `
  query Appointment($id: String!) {
    appointment(id: $id) {
      ${APPOINTMENT_FIELDS}
    }
  }
`;

const CREATE_APPOINTMENT = /* GraphQL */ `
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      ${APPOINTMENT_FIELDS}
    }
  }
`;

const UPDATE_APPOINTMENT_STATUS = /* GraphQL */ `
  mutation UpdateAppointmentStatus($id: String!, $status: AppointmentStatus!) {
    updateAppointmentStatus(id: $id, status: $status) {
      ${APPOINTMENT_FIELDS}
    }
  }
`;

const CANCEL_APPOINTMENT = /* GraphQL */ `
  mutation CancelAppointment($id: String!, $reason: String) {
    cancelAppointment(id: $id, reason: $reason) {
      ${APPOINTMENT_FIELDS}
    }
  }
`;

export async function listRemoteAppointments(
  filter: AppointmentFilter,
): Promise<ActionResult<AppointmentDto[]>> {
  const result = await apiRequest<{ appointments: AppointmentDto[] }, AppointmentFilter>(
    LIST_APPOINTMENTS,
    {
      tenantId: filter.tenantId ?? null,
      tenantSlug: filter.tenantSlug ?? null,
      startDate: filter.startDate ?? null,
      endDate: filter.endDate ?? null,
      specialistId: filter.specialistId ?? null,
      status: filter.status ?? null,
    },
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.appointments };
}

export async function findRemoteAppointment(
  id: string,
): Promise<ActionResult<AppointmentDto | null>> {
  const result = await apiRequest<{ appointment: AppointmentDto | null }, { id: string }>(
    APPOINTMENT,
    { id },
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.appointment };
}

export async function createRemoteAppointment(
  input: CreateAppointmentInput,
): Promise<ActionResult<AppointmentDto>> {
  const result = await apiRequest<
    { createAppointment: AppointmentDto },
    { input: CreateAppointmentInput }
  >(CREATE_APPOINTMENT, { input });
  if (!result.ok) return result;
  return { ok: true, data: result.data.createAppointment };
}

export async function updateRemoteAppointmentStatus(
  id: string,
  status: AppointmentStatusDto,
): Promise<ActionResult<AppointmentDto>> {
  const result = await apiRequest<
    { updateAppointmentStatus: AppointmentDto },
    { id: string; status: AppointmentStatusDto }
  >(UPDATE_APPOINTMENT_STATUS, { id, status });
  if (!result.ok) return result;
  return { ok: true, data: result.data.updateAppointmentStatus };
}

export async function cancelRemoteAppointment(
  id: string,
  reason?: string,
): Promise<ActionResult<AppointmentDto>> {
  const result = await apiRequest<
    { cancelAppointment: AppointmentDto },
    { id: string; reason: string | null }
  >(CANCEL_APPOINTMENT, { id, reason: reason ?? null });
  if (!result.ok) return result;
  return { ok: true, data: result.data.cancelAppointment };
}