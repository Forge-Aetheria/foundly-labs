import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TenantDto } from '../../../shared/infra/remoteTenancy';
import type { AppointmentDto } from '../../../shared/infra/remoteAppointments';
import type { AvailabilityDto } from '../../../shared/infra/remoteAvailability';
import { bookPublicAppointment, fetchOfferedSlots } from '../utils/actions';

const { tenantMock, specialistsMock, availabilityMock, appointmentsMock } = vi.hoisted(() => ({
  tenantMock: vi.fn(),
  specialistsMock: vi.fn(),
  availabilityMock: vi.fn(),
  appointmentsMock: {
    createRemoteAppointment: vi.fn(),
    listRemoteAppointments: vi.fn(),
  },
}));

vi.mock('../../../shared/infra/remoteTenancy', () => ({
  fetchTenantBySlug: (...args: unknown[]) => tenantMock(...args),
}));
vi.mock('../../../shared/infra/remoteSpecialists', () => ({
  listPublicSpecialists: (...args: unknown[]) => specialistsMock(...args),
}));
vi.mock('../../../shared/infra/remoteAvailability', () => ({
  listRemoteAvailability: (...args: unknown[]) => availabilityMock(...args),
}));
vi.mock('../../../shared/infra/remoteAppointments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shared/infra/remoteAppointments')>();
  return {
    ...actual,
    createRemoteAppointment: (...args: unknown[]) =>
      appointmentsMock.createRemoteAppointment(...args),
    listRemoteAppointments: (...args: unknown[]) => appointmentsMock.listRemoteAppointments(...args),
  };
});

function makeTenantDto(): TenantDto {
  return {
    id: 'ten-ana',
    name: 'Estudio Ana',
    category: 'Peluquería',
    status: 'active',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
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
      },
    ],
  };
}

function makeDto(): AppointmentDto {
  return {
    id: 'apt-online-1',
    tenantId: 'ten-ana',
    serviceId: 'svc-corte',
    specialistId: 'res-ana',
    clientName: 'Luis',
    clientContact: 'luis@mail.dev · +34600123456',
    startAt: '2026-06-03T10:00:00.000Z',
    endAt: '2026-06-03T10:30:00.000Z',
    status: 'PENDING',
    appliedDurationMinutes: 30,
    appliedAmountCents: 2000,
    appliedCurrency: 'EUR',
    origin: 'online',
    notes: 'Primera visita',
    cancellationReason: null,
    service: { id: 'svc-corte', name: 'Corte de cabello' },
    specialist: { id: 'res-ana', name: 'Ana' },
  };
}

function makeRule(weekday: number): AvailabilityDto {
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

describe('public-booking actions (feature 010 — remote-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenantMock.mockResolvedValue({ ok: true, data: makeTenantDto() });
    specialistsMock.mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'res-ana',
          tenantId: 'ten-ana',
          name: 'Ana',
          role: null,
          avatar: null,
          bio: null,
          active: true,
          services: [],
        },
      ],
    });
    availabilityMock.mockResolvedValue({ ok: true, data: [0, 1, 2, 3, 4, 5, 6].map(makeRule) });
    appointmentsMock.listRemoteAppointments.mockResolvedValue({ ok: true, data: [] });
    appointmentsMock.createRemoteAppointment.mockResolvedValue({ ok: true, data: makeDto() });
  });

  it('creates a real online appointment through the API', async () => {
    const result = await bookPublicAppointment(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.origin).toBe('online');
      expect(result.data.status).toBe('pending');
      expect(result.data.resourceId).toBe('res-ana');
    }
    expect(appointmentsMock.createRemoteAppointment).toHaveBeenCalledWith({
      tenantId: 'ten-ana',
      serviceId: 'svc-corte',
      specialistId: 'res-ana',
      clientName: 'Luis',
      clientContact: 'luis@mail.dev · +34600123456',
      startAt: '2026-06-03T10:00:00.000Z',
      endAt: '2026-06-03T10:30:00.000Z',
      origin: 'online',
      notes: 'Primera visita',
    });
  });

  it('propagates a CONFLICT from the API', async () => {
    appointmentsMock.createRemoteAppointment.mockResolvedValueOnce({
      ok: false,
      error: { code: 'CONFLICT', message: 'Slot overlaps an existing appointment' },
    });
    const result = await bookPublicAppointment(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CONFLICT');
  });

  it('rejects unknown or non-active tenants without exposing data', async () => {
    tenantMock.mockResolvedValueOnce({ ok: true, data: null });
    const missing = await bookPublicAppointment(input);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe('NOT_FOUND');

    tenantMock.mockResolvedValueOnce({
      ok: true,
      data: { ...makeTenantDto(), status: 'suspended' },
    });
    const closed = await bookPublicAppointment(input);
    expect(closed.ok).toBe(false);
    if (!closed.ok) expect(closed.error.code).toBe('NOT_FOUND');
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

  it('defaults to the tenant first specialist when resourceId is omitted', async () => {
    const result = await bookPublicAppointment({
      tenantSlug: input.tenantSlug,
      serviceId: input.serviceId,
      startAt: input.startAt,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
    });
    expect(result.ok).toBe(true);
    expect(appointmentsMock.createRemoteAppointment).toHaveBeenCalledWith(
      expect.objectContaining({ specialistId: 'res-ana' }),
    );
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
    expect(appointmentsMock.listRemoteAppointments).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'ten-ana', specialistId: 'res-ana' }),
    );
  });

  it('returns no slots when the tenant cannot be resolved', async () => {
    tenantMock.mockResolvedValueOnce({ ok: true, data: null });
    const days = await fetchOfferedSlots({
      tenantSlug: 'no-existe',
      serviceId: 'svc-corte',
      startDate: '2030-01-07',
      endDate: '2030-01-07',
    });
    expect(days).toEqual([]);
  });
});