'use server';

import { z } from 'zod';
import { apiRequest } from '../../shared/api/client';
import {
  AppointmentStatus,
  AppointmentsDocument,
  AvailabilityDocument,
  CreateAppointmentDocument,
  SpecialistsDocument,
  TenantBySlugDocument,
  type AppointmentsQuery,
  type SpecialistsQuery,
} from '../../shared/api/generated';
import { computeAvailability } from '../../shared/utils/computeAvailability';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import type { Appointment } from '../../shared/types/appointments';
import type { PublicBusinessProfile, PublicService, PublicSpecialist } from './utils/types';
import { deriveWeeklyHours } from './utils/availability';

/**
 * Public booking module — server data access (feature 011; constitution §5.VI).
 * Codegen documents/types only. Gallery/policies/reviews have no backend (empty).
 */

export type ResolveResult =
  | { status: 'unavailable'; reason: 'not-found' | 'draft' | 'suspended' }
  | { status: 'available'; business: PublicBusinessProfile };

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

type ApiAppointment = AppointmentsQuery['appointments'][number];

function mapAppointmentStatus(status: AppointmentStatus): Appointment['status'] {
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

function mapSpecialist(dto: SpecialistsQuery['specialists'][number]): PublicSpecialist {
  return {
    id: dto.id,
    name: dto.name,
    role: dto.role ?? null,
    avatar: dto.avatar ?? null,
    bio: dto.bio ?? null,
    services: dto.services.map((service) => service.name),
  };
}

interface Resolved {
  tenantId: string;
  timezone: string;
  service: { id: string; durationMinutes: number };
  specialists: { id: string; name: string }[];
}

async function resolve(slug: string, serviceId: string): Promise<ActionResult<Resolved>> {
  const tenantResult = await apiRequest(TenantBySlugDocument, { slug });
  if (!tenantResult.ok) return tenantResult;
  const tenant = tenantResult.data.tenant;
  if (!tenant || tenant.status !== 'active') {
    return fail('NOT_FOUND', 'Ese negocio no está disponible.');
  }
  const service = tenant.services.find((item) => item.id === serviceId && item.active);
  if (!service) return fail('NOT_FOUND', 'Servicio no encontrado.');

  const specialistsResult = await apiRequest(SpecialistsDocument, { tenantId: null, tenantSlug: slug });
  if (!specialistsResult.ok) return specialistsResult;
  const specialists = specialistsResult.data.specialists
    .filter((specialist) => specialist.active)
    .map((specialist) => ({ id: specialist.id, name: specialist.name }));

  return ok({
    tenantId: tenant.id,
    timezone: tenant.timezone,
    service: { id: service.id, durationMinutes: service.durationMinutes },
    specialists,
  });
}

/** Public mini-site resolution. SERVER-ONLY via the API; no fallback. */
export async function getPublicBusinessRemote(slug: string): Promise<ResolveResult> {
  const tenantResult = await apiRequest(TenantBySlugDocument, { slug });
  if (!tenantResult.ok) return { status: 'unavailable', reason: 'not-found' };
  const tenant = tenantResult.data.tenant;
  if (!tenant) return { status: 'unavailable', reason: 'not-found' };
  if (tenant.status !== 'active') {
    return { status: 'unavailable', reason: tenant.status === 'draft' ? 'draft' : 'suspended' };
  }

  const services: PublicService[] = tenant.services
    .filter((service) => service.active)
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description ?? null,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      currency: service.currency,
      category: service.category ?? undefined,
    }));

  const specialistsResult = await apiRequest(SpecialistsDocument, { tenantId: null, tenantSlug: slug });
  const specialists: PublicSpecialist[] = specialistsResult.ok
    ? specialistsResult.data.specialists.filter((item) => item.active).map(mapSpecialist)
    : [];

  const availabilityResult = await apiRequest(AvailabilityDocument, {
    tenantId: null,
    tenantSlug: slug,
    specialistId: null,
  });
  const weeklyHours = availabilityResult.ok ? deriveWeeklyHours(availabilityResult.data.availability) : [];

  const profile = tenant.profile;
  return {
    status: 'available',
    business: {
      slug: profile?.slug ?? slug,
      name: tenant.name,
      category: tenant.category,
      avatar: profile?.logo ?? null,
      cover: profile?.cover ?? null,
      bio: profile?.bio ?? null,
      address: profile?.address ?? null,
      phone: profile?.phone ?? null,
      social: {
        instagram: profile?.instagram ?? undefined,
        whatsapp: profile?.whatsapp ?? undefined,
      },
      timezone: tenant.timezone,
      services,
      specialists,
      weeklyHours,
      policies: [],
      gallery: [],
      rating: null,
      reviewCount: 0,
      reviews: [],
    },
  };
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
    apiRequest(AvailabilityDocument, { tenantId, tenantSlug: null, specialistId: resourceId }),
    apiRequest(AppointmentsDocument, {
      tenantId,
      tenantSlug: null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      specialistId: resourceId,
      status: null,
    }),
  ]);

  const rules = availabilityResult.ok
    ? availabilityResult.data.availability.map((dto) => ({
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotGranularityMinutes: dto.slotGranularityMinutes,
        minLeadTimeMinutes: dto.minLeadTimeMinutes,
        bookingHorizonDays: dto.bookingHorizonDays,
      }))
    : [];
  const appointments = appointmentsResult.ok
    ? appointmentsResult.data.appointments.map((dto) => ({
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

/** Guest booking: creates a real `origin: 'online'` appointment through the API. */
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

  const created = await apiRequest(CreateAppointmentDocument, {
    input: {
      tenantId,
      serviceId: service.id,
      specialistId: resourceId,
      clientName: parsed.data.clientName,
      clientContact: `${parsed.data.clientEmail} · ${parsed.data.clientPhone}`,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      origin: 'online',
      notes: parsed.data.notes ?? null,
    },
  });
  if (!created.ok) return created;
  return ok(mapAppointment(created.data.createAppointment));
}