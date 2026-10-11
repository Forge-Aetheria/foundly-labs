import type { Appointment, AppointmentStatus } from '../../../shared/types/appointments';
import { getStore } from '../../../shared/infra/store';
import { requireRole, type Session } from '../../../shared/infra/auth';
import { fail, ok, zodFields, type ActionResult } from '../../../shared/infra/result';
import { canTransition } from './lifecycle';
import {
  cancelAppointmentSchema,
  changeStatusSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
} from './schemas';

const MINUTE_MS = 60_000;
const ACTIVE_STATUSES: readonly AppointmentStatus[] = ['pending', 'confirmed', 'checked-in'];

function authorize(session: Session | null, resourceId: string): ActionResult<Session> {
  const auth = requireRole(session, ['admin', 'professional']);
  if (!auth.ok) return auth;
  if (auth.data.role === 'professional' && auth.data.resourceId !== resourceId) {
    return fail('FORBIDDEN', 'Solo puedes gestionar tu propia agenda.');
  }
  return auth;
}

function findConflict(
  resourceId: string,
  start: Date,
  end: Date,
  excludeId?: string,
): Appointment | undefined {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return getStore().appointments.find((appointment) => {
    if (appointment.id === excludeId) return false;
    if (appointment.resourceId !== resourceId) return false;
    if (!ACTIVE_STATUSES.includes(appointment.status)) return false;
    return (
      new Date(appointment.startAt).getTime() < endMs &&
      new Date(appointment.endAt).getTime() > startMs
    );
  });
}

function resolveRate(serviceId: string, at: Date) {
  const atMs = at.getTime();
  return getStore()
    .rates.filter(
      (rate) =>
        rate.serviceId === serviceId &&
        new Date(rate.effectiveFrom).getTime() <= atMs &&
        (rate.effectiveTo === null || new Date(rate.effectiveTo).getTime() > atMs),
    )
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0];
}

function writeAudit(
  appointmentId: string,
  action: 'created' | 'rescheduled' | 'cancelled' | 'status-changed' | 'updated',
  actorId: string,
  fromValue?: string,
  toValue?: string,
  reason?: string,
): void {
  getStore().audit.push({
    id: crypto.randomUUID(),
    appointmentId,
    action,
    fromValue: fromValue ?? null,
    toValue: toValue ?? null,
    reason: reason ?? null,
    actorId,
    createdAt: new Date().toISOString(),
  });
}

export function createAppointment(
  session: Session | null,
  input: unknown,
): ActionResult<Appointment> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de cita inválidos.', zodFields(parsed.error));
  }
  const auth = authorize(session, parsed.data.resourceId);
  if (!auth.ok) return auth;

  const service = getStore().services.find((item) => item.id === parsed.data.serviceId);
  if (!service) return fail('NOT_FOUND', 'Servicio no encontrado.');

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(startAt.getTime() + service.durationMinutes * MINUTE_MS);
  if (endAt <= startAt) {
    return fail('VALIDATION_ERROR', 'La hora de fin debe ser posterior al inicio.');
  }
  if (findConflict(parsed.data.resourceId, startAt, endAt)) {
    return fail('CONFLICT', 'Ese horario ya está ocupado para este recurso.');
  }

  const rate = resolveRate(parsed.data.serviceId, startAt);
  const now = new Date().toISOString();
  const appointment: Appointment = {
    id: crypto.randomUUID(),
    resourceId: parsed.data.resourceId,
    serviceId: parsed.data.serviceId,
    clientName: parsed.data.clientName,
    clientContact: parsed.data.clientContact ?? null,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    status: 'pending',
    notes: parsed.data.notes ?? null,
    appliedDurationMinutes: service.durationMinutes,
    appliedAmountCents: rate?.amountCents ?? 0,
    appliedCurrency: rate?.currency ?? 'EUR',
    origin: 'admin',
    cancellationReason: null,
    createdAt: now,
    updatedAt: now,
  };

  getStore().appointments.push(appointment);
  writeAudit(appointment.id, 'created', auth.data.userId);
  return ok(appointment);
}

export function rescheduleAppointment(
  session: Session | null,
  input: unknown,
): ActionResult<Appointment> {
  const parsed = rescheduleAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de reprogramación inválidos.', zodFields(parsed.error));
  }
  const current = getStore().appointments.find((item) => item.id === parsed.data.appointmentId);
  if (!current) return fail('NOT_FOUND', 'Cita no encontrada.');
  const auth = authorize(session, current.resourceId);
  if (!auth.ok) return auth;
  if (current.status !== 'pending' && current.status !== 'confirmed') {
    return fail('STATE_ERROR', 'Solo se pueden reprogramar citas pendientes o confirmadas.');
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(startAt.getTime() + current.appliedDurationMinutes * MINUTE_MS);
  if (findConflict(current.resourceId, startAt, endAt, current.id)) {
    return fail('CONFLICT', 'Ese horario ya está ocupado para este recurso.');
  }

  const previousStart = current.startAt;
  current.startAt = startAt.toISOString();
  current.endAt = endAt.toISOString();
  current.updatedAt = new Date().toISOString();
  writeAudit(current.id, 'rescheduled', auth.data.userId, previousStart, current.startAt);
  return ok(current);
}

export function cancelAppointment(
  session: Session | null,
  input: unknown,
): ActionResult<Appointment> {
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Motivo de cancelación requerido.', zodFields(parsed.error));
  }
  const current = getStore().appointments.find((item) => item.id === parsed.data.appointmentId);
  if (!current) return fail('NOT_FOUND', 'Cita no encontrada.');
  const auth = authorize(session, current.resourceId);
  if (!auth.ok) return auth;
  if (
    current.status === 'completed' ||
    current.status === 'cancelled' ||
    current.status === 'no-show'
  ) {
    return fail('STATE_ERROR', 'La cita ya está en un estado terminal.');
  }

  const previous = current.status;
  current.status = 'cancelled';
  current.cancellationReason = parsed.data.reason;
  current.updatedAt = new Date().toISOString();
  writeAudit(current.id, 'cancelled', auth.data.userId, previous, 'cancelled', parsed.data.reason);
  return ok(current);
}

export function changeAppointmentStatus(
  session: Session | null,
  input: unknown,
): ActionResult<Appointment> {
  const parsed = changeStatusSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Estado inválido.', zodFields(parsed.error));
  }
  const current = getStore().appointments.find((item) => item.id === parsed.data.appointmentId);
  if (!current) return fail('NOT_FOUND', 'Cita no encontrada.');
  const auth = authorize(session, current.resourceId);
  if (!auth.ok) return auth;

  const next = parsed.data.status;
  if (next === current.status) return ok(current);
  if (!canTransition(current.status, next)) {
    return fail('STATE_ERROR', `Transición no permitida: ${current.status} → ${next}.`);
  }

  const previous = current.status;
  current.status = next;
  current.updatedAt = new Date().toISOString();
  writeAudit(current.id, 'status-changed', auth.data.userId, previous, next);
  return ok(current);
}
