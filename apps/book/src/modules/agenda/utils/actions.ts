'use server';

import type { Appointment } from '../../../shared/types/appointments';
import { getAccessToken, getEffectiveSession } from '../../../shared/infra/authServer';
import { listRemoteServices } from '../../../shared/infra/remoteCatalog';
import {
  cancelRemoteAppointment,
  createRemoteAppointment,
  findRemoteAppointment,
  mapAppointmentDto,
  updateRemoteAppointmentStatus,
  type AppointmentDto,
} from '../../../shared/infra/remoteAppointments';
import { fail, zodFields, type ActionResult } from '../../../shared/infra/result';
import { cancelAppointmentSchema, changeStatusSchema, createAppointmentSchema } from './schemas';

const MINUTE_MS = 60_000;

/** API statuses that the book can target (the provider API has no checked-in/no-show). */
const API_TARGET_STATUS = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  cancelled: 'CANCELLED',
  completed: 'COMPLETED',
} as const;
type ApiTargetStatus = (typeof API_TARGET_STATUS)[keyof typeof API_TARGET_STATUS];

function toApiStatus(status: string): ApiTargetStatus | null {
  return API_TARGET_STATUS[status as keyof typeof API_TARGET_STATUS] ?? null;
}

/** Load a remote appointment and authorize the acting session against its resource. */
async function loadAuthorizedAppointment(
  appointmentId: string,
): Promise<ActionResult<AppointmentDto>> {
  const session = await getEffectiveSession();
  if (!session) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de Foundly Pass.');
  }
  const found = await findRemoteAppointment(appointmentId);
  if (!found.ok) return found;
  if (!found.data) return fail('NOT_FOUND', 'Cita no encontrada.');
  if (session.role === 'professional' && session.resourceId !== found.data.specialistId) {
    return fail('FORBIDDEN', 'Solo puedes gestionar tu propia agenda.');
  }
  return { ok: true, data: found.data };
}

/**
 * Agenda server actions (feature 010 — T012). All reads/writes go through
 * `remoteAppointments`; the API owns conflict detection, lifecycle and audit.
 */

export async function createAppointment(input: unknown): Promise<ActionResult<Appointment>> {
  const session = await getEffectiveSession();
  if (!session) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de Foundly Pass.');
  }

  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de cita inválidos.', zodFields(parsed.error));
  }
  if (session.role === 'professional' && session.resourceId !== parsed.data.resourceId) {
    return fail('FORBIDDEN', 'Solo puedes gestionar tu propia agenda.');
  }
  if (!session.tenantId) {
    return fail('FORBIDDEN', 'La sesión no está asociada a un negocio.');
  }

  const token = await getAccessToken();
  const services = await listRemoteServices(token, session.tenantId);
  if (!services.ok) return services;
  const service = services.data.services.find((item) => item.id === parsed.data.serviceId);
  if (!service) return fail('NOT_FOUND', 'Servicio no encontrado.');

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(startAt.getTime() + service.durationMinutes * MINUTE_MS);
  const created = await createRemoteAppointment({
    tenantId: session.tenantId,
    serviceId: service.id,
    specialistId: parsed.data.resourceId,
    clientName: parsed.data.clientName,
    clientContact: parsed.data.clientContact ?? null,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    origin: 'admin',
    notes: parsed.data.notes ?? null,
  });
  if (!created.ok) return created;
  return okAppointment(created.data);
}

export async function cancelAppointment(input: unknown): Promise<ActionResult<Appointment>> {
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Motivo de cancelación requerido.', zodFields(parsed.error));
  }
  const auth = await loadAuthorizedAppointment(parsed.data.appointmentId);
  if (!auth.ok) return auth;
  const cancelled = await cancelRemoteAppointment(parsed.data.appointmentId, parsed.data.reason);
  if (!cancelled.ok) return cancelled;
  return okAppointment(cancelled.data);
}

export async function changeAppointmentStatus(
  input: unknown,
): Promise<ActionResult<Appointment>> {
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
  const updated = await updateRemoteAppointmentStatus(parsed.data.appointmentId, apiStatus);
  if (!updated.ok) return updated;
  return okAppointment(updated.data);
}

function okAppointment(dto: AppointmentDto): ActionResult<Appointment> {
  return { ok: true, data: mapAppointmentDto(dto) };
}