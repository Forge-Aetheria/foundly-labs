import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppointmentStatus,
  AvailabilityDocument,
  CreateAppointmentDocument,
  PublicAppointmentsDocument,
  SpecialistsDocument,
  TenantBySlugDocument,
  TimeBlocksDocument,
} from '../../../shared/api/generated';
import { bookPublicAppointment, fetchOfferedSlots } from '../actions';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock('../../../shared/api/client', () => ({ apiRequest: (...args: unknown[]) => apiMock(...args) }));

function makeTenant() {
  return {
    id: 'ten-ana',
    name: 'Estudio Ana',
    category: 'Peluquería',
    status: 'active',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    isPublic: true,
    profile: {
      slug: 'estudio-ana',
      bio: null,
      address: null,
      phone: null,
      instagram: null,
      whatsapp: null,
      logo: null,
      cover: null,
    },
    services: [
      {
        id: 'svc-corte',
        name: 'Corte de cabello',
        description: null,
        durationMinutes: 30,
        priceCents: 2000,
        currency: 'EUR',
        category: null,
        active: true,
        requiresAdvance: false,
        advanceKind: null,
        advanceValue: null,
      },
    ],
  };
}

function makeSpecialist() {
  return {
    id: 'res-ana',
    tenantId: 'ten-ana',
    name: 'Ana',
    role: null,
    avatar: null,
    bio: null,
    active: true,
    services: [],
  };
}

function makeRule(weekday: number) {
  return {
    id: `rule-${weekday}`,
    tenantId: 'ten-ana',
    specialistId: null,
    weekday,
    startTime: '09:00',
    endTime: '18:00',
    slotGranularityMinutes: 30,
    minLeadTimeMinutes: 0,
    bookingHorizonDays: 3650,
    breaks: null,
  };
}

function makeDto() {
  return {
    id: 'apt-online-1',
    tenantId: 'ten-ana',
    serviceId: 'svc-corte',
    specialistId: 'res-ana',
    clientName: 'Luis',
    clientContact: 'luis@mail.dev · +34600123456',
    startAt: '2026-06-03T10:00:00.000Z',
    endAt: '2026-06-03T10:30:00.000Z',
    status: AppointmentStatus.Pending,
    appliedDurationMinutes: 30,
    appliedAmountCents: 2000,
    appliedCurrency: 'EUR',
    origin: 'online',
    notes: null,
    cancellationReason: null,
    paymentMethodType: null,
    advanceAmountCents: null,
    paymentReference: null,
    paymentProofUrl: null,
    paymentSubmittedAt: null,
    notifications: [],
    service: { id: 'svc-corte', name: 'Corte de cabello' },
    specialist: { id: 'res-ana', name: 'Ana' },
  };
}

const input = {
  tenantSlug: 'estudio-ana',
  serviceId: 'svc-corte',
  resourceId: 'res-ana',
  startAt: '2026-06-03T10:00:00Z',
  clientName: 'Luis',
  clientEmail: 'luis@mail.dev',
  clientPhone: '+34600123456',
  notes: 'Primera visita',
};

describe('public-booking actions (feature 011 — remote-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.mockImplementation(async (document: unknown) => {
      if (document === TenantBySlugDocument) return { ok: true, data: { tenant: makeTenant() } };
      if (document === SpecialistsDocument) return { ok: true, data: { specialists: [makeSpecialist()] } };
      if (document === AvailabilityDocument)
        return { ok: true, data: { availability: [0, 1, 2, 3, 4, 5, 6].map(makeRule) } };
      if (document === PublicAppointmentsDocument) return { ok: true, data: { appointments: [] } };
      if (document === CreateAppointmentDocument)
        return { ok: true, data: { createAppointment: makeDto() } };
      return { ok: false, error: { code: 'STATE_ERROR', message: 'unexpected' } };
    });
  });

  it('creates a real online appointment through the API', async () => {
    const result = await bookPublicAppointment(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.origin).toBe('online');
      expect(result.data.status).toBe('pending');
      expect(result.data.resourceId).toBe('res-ana');
    }
    expect(apiMock).toHaveBeenCalledWith(
      CreateAppointmentDocument,
      expect.objectContaining({
        input: expect.objectContaining({
          origin: 'online',
          clientContact: 'luis@mail.dev · +34600123456',
          specialistId: 'res-ana',
        }),
      }),
    );
  });

  it('propagates a CONFLICT from the API', async () => {
    apiMock.mockImplementation(async (document: unknown) => {
      if (document === TenantBySlugDocument) return { ok: true, data: { tenant: makeTenant() } };
      if (document === SpecialistsDocument) return { ok: true, data: { specialists: [makeSpecialist()] } };
      return { ok: false, error: { code: 'CONFLICT', message: 'Slot overlaps' } };
    });
    const result = await bookPublicAppointment(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CONFLICT');
  });

  it('rejects unknown or non-active tenants without exposing data', async () => {
    apiMock.mockResolvedValueOnce({ ok: true, data: { tenant: null } });
    const missing = await bookPublicAppointment(input);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe('NOT_FOUND');

    apiMock.mockResolvedValueOnce({ ok: true, data: { tenant: { ...makeTenant(), status: 'suspended' } } });
    const closed = await bookPublicAppointment(input);
    expect(closed.ok).toBe(false);
    if (!closed.ok) expect(closed.error.code).toBe('NOT_FOUND');
  });

  it('rejects booking when the public page is disabled (isPublic false)', async () => {
    apiMock.mockImplementation(async (document: unknown) => {
      if (document === TenantBySlugDocument)
        return { ok: true, data: { tenant: { ...makeTenant(), isPublic: false } } };
      if (document === SpecialistsDocument) return { ok: true, data: { specialists: [makeSpecialist()] } };
      return { ok: false, error: { code: 'STATE_ERROR', message: 'unexpected' } };
    });
    const result = await bookPublicAppointment(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects a service that does not belong to the tenant', async () => {
    const result = await bookPublicAppointment({ ...input, serviceId: 'svc-fake' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects a specialist that does not belong to the tenant', async () => {
    const result = await bookPublicAppointment({ ...input, resourceId: 'res-other' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects malformed input with VALIDATION_ERROR', async () => {
    const result = await bookPublicAppointment({ ...input, clientEmail: 'not-an-email' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('offers slots computed from API availability + appointments', async () => {
    const days = await fetchOfferedSlots({
      tenantSlug: 'estudio-ana',
      serviceId: 'svc-corte',
      resourceId: 'res-ana',
      startDate: '2030-01-07',
      endDate: '2030-01-07',
    });
    expect(days).toHaveLength(1);
    expect(days[0]?.date).toBe('2030-01-07');
    expect(days[0]?.slots.length).toBeGreaterThan(0);
  });

  it('returns no slots when the tenant cannot be resolved', async () => {
    apiMock.mockResolvedValueOnce({ ok: true, data: { tenant: null } });
    const days = await fetchOfferedSlots({
      tenantSlug: 'no-existe',
      serviceId: 'svc-corte',
      startDate: '2030-01-07',
      endDate: '2030-01-07',
    });
    expect(days).toEqual([]);
  });

  it('excludes slots covered by a time block (feature 015)', async () => {
    apiMock.mockImplementation(async (document: unknown) => {
      if (document === TenantBySlugDocument) return { ok: true, data: { tenant: makeTenant() } };
      if (document === SpecialistsDocument) return { ok: true, data: { specialists: [makeSpecialist()] } };
      if (document === AvailabilityDocument)
        return { ok: true, data: { availability: [0, 1, 2, 3, 4, 5, 6].map(makeRule) } };
      if (document === PublicAppointmentsDocument) return { ok: true, data: { appointments: [] } };
      if (document === TimeBlocksDocument)
        return {
          ok: true,
          data: {
            timeBlocks: [
              {
                id: 'tb1',
                tenantId: 'ten-ana',
                specialistId: null,
                startAt: '2030-01-07T00:00:00.000Z',
                endAt: '2030-01-08T00:00:00.000Z',
                reason: 'Festivo',
              },
            ],
          },
        };
      return { ok: false, error: { code: 'STATE_ERROR', message: 'unexpected' } };
    });

    const days = await fetchOfferedSlots({
      tenantSlug: 'estudio-ana',
      serviceId: 'svc-corte',
      resourceId: 'res-ana',
      startDate: '2030-01-07',
      endDate: '2030-01-07',
    });
    expect(days).toHaveLength(1);
    expect(days[0]?.slots).toEqual([]);
  });
});