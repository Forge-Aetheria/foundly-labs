'use server';

import { z } from 'zod';
import type { Appointment } from '../../../shared/types/appointments';
import { computeAvailability } from '../../../shared/utils/computeAvailability';
import { fetchTenantBySlug } from '../../../shared/infra/remoteTenancy';
import { listPublicSpecialists } from '../../../shared/infra/remoteSpecialists';
import { listRemoteAvailability } from '../../../shared/infra/remoteAvailability';
import {
  createRemoteAppointment,
  listRemoteAppointments,
  mapAppointmentDto,
  mapAppointmentStatus,
} from '../../../shared/infra/remoteAppointments';
import { fail, ok, zodFields, type ActionResult } from '../../../shared/infra/result';

const MINUTE_MS = 60_000;

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

const slotQuerySchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().min(1),
  resourceId: z.string().min(1).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
export type SlotQueryInput = z.infer<typeof slotQuerySchema>;

export interface SlotDay {
  date: string;
  slots: { startAt: string; endAt: string }[];
}

interface Resolved {
  tenantId: string;
  timezone: string;
  service: { id: string; durationMinutes: number };
  specialists: { id: string; name: string }[];
}

/** Resolve an active tenant + service + bookable specialists from the API. */
async function resolve(slug: string, serviceId: string): Promise<ActionResult<Resolved>> {
  const tenantResult = await fetchTenantBySlug(slug);
  if (!tenantResult.ok) return tenantResult;
  const tenant = tenantResult.data;
  if (!tenant || tenant.status !== 'active') {
    return fail('NOT_FOUND', 'Ese negocio no está disponible.');
  }
  const service = tenant.services.find((item) => item.id === serviceId && item.active);
  if (!service) return fail('NOT_FOUND', 'Servicio no encontrado.');

  const specialistsResult = await listPublicSpecialists({ tenantSlug: slug });
  if (!specialistsResult.ok) return specialistsResult;
  const specialists = specialistsResult.data
    .filter((specialist) => specialist.active)
    .map((specialist) => ({ id: specialist.id, name: specialist.name }));

  return ok({
    tenantId: tenant.id,
    timezone: tenant.timezone,
    service: { id: service.id, durationMinutes: service.durationMinutes },
    specialists,
  });
}

/** Serializable slot lookup consumed by the client booking flow (per specialist). */
export async function fetchOfferedSlots(input: unknown): Promise<SlotDay[]> {
  const parsed = slotQuerySchema.safeParse(input);
  if (!parsed.success) return [];
  const resolved = await resolve(parsed.data.tenantSlug, parsed.data.serviceId);
  if (!resolved.ok) return [];
  const { tenantId, timezone, service, specialists } = resolved.data;

  const resourceId = parsed.data.resourceId ?? specialists[0]?.id;
  if (!resourceId) return [];

  const [availabilityResult, appointmentsResult] = await Promise.all([
    listRemoteAvailability({ tenantId, specialistId: resourceId }),
    listRemoteAppointments({
      tenantId,
      specialistId: resourceId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    }),
  ]);

  const rules = availabilityResult.ok
    ? availabilityResult.data.map((dto) => ({
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotGranularityMinutes: dto.slotGranularityMinutes,
        minLeadTimeMinutes: dto.minLeadTimeMinutes,
        bookingHorizonDays: dto.bookingHorizonDays,
      }))
    : [];
  const appointments = appointmentsResult.ok
    ? appointmentsResult.data.map((dto) => ({
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        status: mapAppointmentStatus(dto.status),
      }))
    : [];

  const days = computeAvailability({
    resourceId,
    service: { durationMinutes: service.durationMinutes, bufferMinutes: 0 },
    range: { startDate: parsed.data.startDate, endDate: parsed.data.endDate },
    timezone,
    rules,
    blocks: [],
    appointments,
    now: new Date(),
  });

  return days.map((day) => ({
    date: day.date,
    slots: day.slots.map((slot) => ({
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt.toISOString(),
    })),
  }));
}

/**
 * Guest booking on the public portal (FR-018; feature 010 — T016): creates a
 * real `origin: 'online'` appointment through the API. The API owns conflict
 * detection; failures surface (no local fallback).
 */
export async function bookPublicAppointment(input: unknown): Promise<ActionResult<Appointment>> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de reserva inválidos.', zodFields(parsed.error));
  }

  const resolved = await resolve(parsed.data.tenantSlug, parsed.data.serviceId);
  if (!resolved.ok) return resolved;
  const { tenantId, service, specialists } = resolved.data;

  const resourceId = parsed.data.resourceId ?? specialists[0]?.id;
  if (!resourceId || !specialists.some((specialist) => specialist.id === resourceId)) {
    return fail('NOT_FOUND', 'Recurso no encontrado.');
  }

  const start = new Date(parsed.data.startAt);
  const end = new Date(start.getTime() + service.durationMinutes * MINUTE_MS);
  if (end <= start) {
    return fail('VALIDATION_ERROR', 'La hora de fin debe ser posterior al inicio.');
  }

  const created = await createRemoteAppointment({
    tenantId,
    serviceId: service.id,
    specialistId: resourceId,
    clientName: parsed.data.clientName,
    clientContact: `${parsed.data.clientEmail} · ${parsed.data.clientPhone}`,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    origin: 'online',
    notes: parsed.data.notes ?? null,
  });
  if (!created.ok) return created;
  return ok(mapAppointmentDto(created.data));
}