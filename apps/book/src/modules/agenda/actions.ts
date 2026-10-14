'use server';

import { apiRequestAdmin } from '../../shared/api/admin-request';
import {
  AppointmentStatus,
  CancelAppointmentDocument,
  CreateMyAppointmentDocument,
  MyAppointmentDocument,
  MyAppointmentsDocument,
  RescheduleAppointmentDocument,
  UpdateAppointmentStatusDocument,
  MyServicesDocument,
  type MyAppointmentsQuery,
} from '../../shared/api/generated';
import { getEffectiveSession } from '../../shared/auth/authServer';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import type { Appointment } from '../../shared/types/appointments';
import { cancelAppointmentSchema, changeStatusSchema, createAppointmentSchema, rescheduleAppointmentSchema } from './utils/schemas';

/**
 * Agenda module — server data access (feature 011; constitution §5.VI).
 * Codegen documents/types only. The API owns conflicts/lifecycle; reads/writes are auth-scoped (017).
 */

export interface AgendaFilter {
  from: Date;
  to: Date;
  resourceId?: string;
}

type ApiAppointment = MyAppointmentsQuery['myAppointments'][number];

const MINUTE_MS = 60_000;

const API_TARGET_STATUS = {
  pending: AppointmentStatus.Pending,
  confirmed: AppointmentStatus.Confirmed,
  cancelled: AppointmentStatus.Cancelled,
  completed: AppointmentStatus.Completed,
} as const;

function toApiStatus(status: string): AppointmentStatus | null {
  return API_TARGET_STATUS[status as keyof typeof API_TARGET_STATUS] ?? null;
}

function mapStatus(status: AppointmentStatus): Appointment['status'] {
  switch (status) {
    case AppointmentStatus.Pending:
      return 'pending';
    case AppointmentStatus.Confirmed:
      return 'confirmed';
    case AppointmentStatus.Cancelled:
      return 'cancelled';
    case AppointmentStatus.Completed:
      return 'completed';
    default:
      return 'pending';
  }
}

function mapAppointment(dto: ApiAppointment): Appointment {
  return {
    id: dto.id,
    resourceId: dto.specialistId,
    serviceId: dto.serviceId,
    clientName: dto.clientName,
    clientContact: dto.clientContact ?? null,
    startAt: dto.startAt,
    endAt: dto.endAt,
    status: mapStatus(dto.status),
    notes: dto.notes ?? null,
    appliedDurationMinutes: dto.appliedDurationMinutes,
    appliedAmountCents: dto.appliedAmountCents,
    appliedCurrency: dto.appliedCurrency,
    origin: dto.origin === 'admin' ? 'admin' : 'online',
    cancellationReason: dto.cancellationReason ?? null,
    payment: dto.paymentMethodType
      ? {
          methodType: dto.paymentMethodType,
          amountCents: dto.advanceAmountCents ?? 0,
          reference: dto.paymentReference ?? '',
          proofUrl: dto.paymentProofUrl ?? '',
          submittedAt: dto.paymentSubmittedAt ?? '',
        }
      : null,
    notifications: dto.notifications.map((notification) => ({
      id: notification.id,
      kind: notification.kind,
      message: notification.message,
      channel: notification.channel,
      createdAt: notification.createdAt,
    })),
    createdAt: dto.startAt,
    updatedAt: dto.startAt,
  };
}

/** Appointments inside the window, scoped to the authenticated tenant. SERVER-ONLY. */
export async function listAgenda(filter: AgendaFilter): Promise<ActionResult<Appointment[]>> {
  const result = await apiRequestAdmin(MyAppointmentsDocument, {
    from: filter.from.toISOString(),
    to: filter.to.toISOString(),
    specialistId: filter.resourceId ?? null,
    status: null,
  });
  if (!result.ok) return result;
  return ok(result.data.myAppointments.map(mapAppointment));
}

async function loadAuthorizedAppointment(appointmentId: string): Promise<ActionResult<ApiAppointment>> {
  const session = await getEffectiveSession();
  if (!session) return fail('UNAUTHENTICATED', 'Se requiere una sesión de Foundly Pass.');
  const found = await apiRequestAdmin(MyAppointmentDocument, { id: appointmentId });
  if (!found.ok) return found;
  if (!found.data.myAppointment) return fail('NOT_FOUND', 'Cita no encontrada.');
  const appointment = found.data.myAppointment;
  if (session.role === 'professional' && session.resourceId !== appointment.specialistId) {
    return fail('FORBIDDEN', 'Solo puedes gestionar tu propia agenda.');
  }
  return ok(appointment);
}

export async function createAppointment(input: unknown): Promise<ActionResult<Appointment>> {
  const session = await getEffectiveSession();
  if (!session) return fail('UNAUTHENTICATED', 'Se requiere una sesión de Foundly Pass.');

  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de cita inválidos.', zodFields(parsed.error));
  }
  if (session.role === 'professional' && session.resourceId !== parsed.data.resourceId) {
    return fail('FORBIDDEN', 'Solo puedes gestionar tu propia agenda.');
  }
  if (!session.tenantId) return fail('FORBIDDEN', 'La sesión no está asociada a un negocio.');

  const services = await apiRequestAdmin(MyServicesDocument, { active: null });
  if (!services.ok) return services;
  const service = services.data.myServices.find((item) => item.id === parsed.data.serviceId);
  if (!service) return fail('NOT_FOUND', 'Servicio no encontrado.');

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(startAt.getTime() + service.durationMinutes * MINUTE_MS);
  const created = await apiRequestAdmin(CreateMyAppointmentDocument, {
    input: {
      serviceId: service.id,
      specialistId: parsed.data.resourceId,
      clientName: parsed.data.clientName,
      clientContact: parsed.data.clientContact ?? null,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      origin: 'admin',
      notes: parsed.data.notes ?? null,
    },
  });
  if (!created.ok) return created;
  return ok(mapAppointment(created.data.createMyAppointment));
}

export async function cancelAppointment(input: unknown): Promise<ActionResult<Appointment>> {
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Motivo de cancelación requerido.', zodFields(parsed.error));
  }
  const auth = await loadAuthorizedAppointment(parsed.data.appointmentId);
  if (!auth.ok) return auth;
  const cancelled = await apiRequestAdmin(CancelAppointmentDocument, {
    id: parsed.data.appointmentId,
    reason: parsed.data.reason,
  });
  if (!cancelled.ok) return cancelled;
  return ok(mapAppointment(cancelled.data.cancelAppointment));
}

export async function changeAppointmentStatus(input: unknown): Promise<ActionResult<Appointment>> {
  const parsed = changeStatusSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Estado inválido.', zodFields(parsed.error));
  }
  const apiStatus = toApiStatus(parsed.data.status);
  if (!apiStatus) {
    return fail('VALIDATION_ERROR', 'Transición no soportada por el proveedor.');
  }
  const auth = await loadAuthorizedAppointment(parsed.data.appointmentId);
  if (!auth.ok) return auth;
  const updated = await apiRequestAdmin(UpdateAppointmentStatusDocument, {
    id: parsed.data.appointmentId,
    status: apiStatus,
  });
  if (!updated.ok) return updated;
  return ok(mapAppointment(updated.data.updateAppointmentStatus));
}

export async function rescheduleAppointment(input: unknown): Promise<ActionResult<Appointment>> {
  const parsed = rescheduleAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de reprogramación inválidos.', zodFields(parsed.error));
  }
  const auth = await loadAuthorizedAppointment(parsed.data.appointmentId);
  if (!auth.ok) return auth;
  const updated = await apiRequestAdmin(RescheduleAppointmentDocument, {
    input: { id: parsed.data.appointmentId, startAt: parsed.data.startAt },
  });
  if (!updated.ok) return updated;
  return ok(mapAppointment(updated.data.rescheduleAppointment));
}
