import { z } from 'zod';
import type { Appointment } from '../../../shared/types/appointments';
import { getStore } from '../../../shared/infra/store';
import { fail, ok, zodFields, type ActionResult } from '../../../shared/infra/result';
import { getOfferedSlots, getPublicBusiness } from './queries';

const MINUTE_MS = 60_000;
const ACTIVE_STATUSES: readonly Appointment['status'][] = ['pending', 'confirmed', 'checked-in'];

const bookSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().min(1),
  resourceId: z.string().min(1).optional(),
  startAt: z.string().datetime({ offset: true }),
  clientName: z.string().min(1).max(120),
  clientEmail: z.string().email(),
  clientPhone: z
    .string()
    .min(8)
    .max(20)
    .regex(/^[0-9+\- ]+$/),
  notes: z.string().max(2000).optional(),
});
export type BookPublicInput = z.infer<typeof bookSchema>;

export interface SlotDay {
  date: string;
  slots: { startAt: string; endAt: string }[];
}

function findConflict(resourceId: string, start: Date, end: Date): Appointment | undefined {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return getStore().appointments.find((appointment) => {
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

/** Guest booking on the public portal (FR-018): creates an `origin: 'online'` appointment. */
export function bookPublicAppointment(input: unknown): ActionResult<Appointment> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de reserva inválidos.', zodFields(parsed.error));
  }
  const {
    tenantSlug,
    serviceId,
    resourceId,
    startAt,
    clientName,
    clientEmail,
    clientPhone,
    notes,
  } = parsed.data;
  const store = getStore();

  const resolved = getPublicBusiness(tenantSlug);
  if (resolved.status !== 'available') {
    return fail('NOT_FOUND', 'Ese negocio no está disponible.');
  }

  const tenant = store.tenants.find((item) => item.slug === tenantSlug);
  const service = store.services.find(
    (item) => item.id === serviceId && item.tenantId === tenant?.id && item.active,
  );
  if (!tenant || !service) return fail('NOT_FOUND', 'Servicio no encontrado.');

  const resource = resourceId
    ? store.resources.find((item) => item.tenantId === tenant.id && item.id === resourceId)
    : store.resources.find((item) => item.tenantId === tenant.id);
  if (!resource) return fail('NOT_FOUND', 'Recurso no encontrado.');

  const start = new Date(startAt);
  const end = new Date(start.getTime() + service.durationMinutes * MINUTE_MS);
  if (end <= start) {
    return fail('VALIDATION_ERROR', 'La hora de fin debe ser posterior al inicio.');
  }
  if (findConflict(resource.id, start, end)) {
    return fail('CONFLICT', 'Ese hueco ya está ocupado.');
  }

  const rate = resolveRate(service.id, start);
  const now = new Date().toISOString();
  const appointment: Appointment = {
    id: crypto.randomUUID(),
    resourceId: resource.id,
    serviceId: service.id,
    clientName,
    clientContact: `${clientEmail} · ${clientPhone}`,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    status: 'pending',
    notes: notes ?? null,
    appliedDurationMinutes: service.durationMinutes,
    appliedAmountCents: rate?.amountCents ?? 0,
    appliedCurrency: rate?.currency ?? 'EUR',
    origin: 'online',
    cancellationReason: null,
    createdAt: now,
    updatedAt: now,
  };

  store.appointments.push(appointment);
  store.audit.push({
    id: crypto.randomUUID(),
    appointmentId: appointment.id,
    action: 'created',
    fromValue: null,
    toValue: null,
    reason: null,
    actorId: 'online-guest',
    createdAt: now,
  });
  return ok(appointment);
}

/** Serializable slot lookup consumed by the client booking flow (per specialist). */
export function fetchOfferedSlots(input: {
  tenantSlug: string;
  serviceId: string;
  resourceId?: string;
  startDate: string;
  endDate: string;
}): SlotDay[] {
  const tenant = getStore().tenants.find((item) => item.slug === input.tenantSlug);
  if (!tenant || tenant.status !== 'active') return [];
  const days = getOfferedSlots(
    tenant,
    input.serviceId,
    { startDate: input.startDate, endDate: input.endDate },
    new Date(),
    input.resourceId,
  );
  return days.map((day) => ({
    date: day.date,
    slots: day.slots.map((slot) => ({
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt.toISOString(),
    })),
  }));
}
