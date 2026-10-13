import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TenantDto } from '../../../shared/infra/remoteTenancy';
import type { AvailabilityDto } from '../../../shared/infra/remoteAvailability';
import type { PublicSpecialistDto } from '../../../shared/infra/remoteSpecialists';
import { deriveWeeklyHours, getPublicBusinessRemote } from '../utils/queries';

const { tenantMock, specialistsMock, availabilityMock } = vi.hoisted(() => ({
  tenantMock: vi.fn(),
  specialistsMock: vi.fn(),
  availabilityMock: vi.fn(),
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

function makeTenantDto(status = 'active'): TenantDto {
  return {
    id: 'ten-ana',
    name: 'Estudio Ana',
    category: 'Peluquería',
    status,
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    profile: {
      slug: 'estudio-ana',
      bio: 'Estudio de referencia en Madrid.',
      address: 'Calle Mayor 7, 28013 Madrid',
      phone: '+34 612 345 678',
      instagram: 'https://instagram.com/estudioana',
      whatsapp: 'https://wa.me/34612345678',
      logo: null,
      cover: null,
    },
    services: [
      {
        id: 'svc-corte',
        name: 'Corte de cabello',
        description: 'Corte y peinado',
        durationMinutes: 30,
        priceCents: 2000,
        currency: 'EUR',
        category: 'Peluquería',
        active: true,
      },
      {
        id: 'svc-inactive',
        name: 'Oculto',
        description: null,
        durationMinutes: 20,
        priceCents: 1000,
        currency: 'EUR',
        category: null,
        active: false,
      },
    ],
  };
}

function makeSpecialist(): PublicSpecialistDto {
  return {
    id: 'res-ana',
    tenantId: 'ten-ana',
    name: 'Ana',
    role: 'Peluquera senior',
    avatar: null,
    bio: null,
    active: true,
    services: [{ id: 'svc-corte', name: 'Corte de cabello' }],
  };
}

function makeRule(overrides: Partial<AvailabilityDto> = {}): AvailabilityDto {
  return {
    id: 'rule-1',
    tenantId: 'ten-ana',
    specialistId: null,
    weekday: 1,
    startTime: '09:00',
    endTime: '18:00',
    slotGranularityMinutes: 30,
    minLeadTimeMinutes: 0,
    bookingHorizonDays: 60,
    breaks: null,
    ...overrides,
  };
}

describe('public-booking queries (feature 010 — server-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenantMock.mockResolvedValue({ ok: true, data: makeTenantDto() });
    specialistsMock.mockResolvedValue({ ok: true, data: [makeSpecialist()] });
    availabilityMock.mockResolvedValue({ ok: true, data: [makeRule()] });
  });

  it('resolves an active tenant with API services, specialists and availability', async () => {
    const result = await getPublicBusinessRemote('estudio-ana');
    expect(result.status).toBe('available');
    if (result.status !== 'available') return;

    expect(result.business.name).toBe('Estudio Ana');
    expect(result.business.slug).toBe('estudio-ana');
    expect(result.business.bio).toContain('Madrid');
    // Only active services are exposed.
    expect(result.business.services.map((service) => service.id)).toEqual(['svc-corte']);
    expect(result.business.services[0]?.priceCents).toBe(2000);
    // Specialists come from the API, carrying their assigned service names.
    expect(result.business.specialists[0]?.services).toEqual(['Corte de cabello']);
    // Weekly hours derived from tenant-level availability.
    expect(result.business.weeklyHours).toHaveLength(7);
    expect(result.business.weeklyHours.find((day) => day.weekday === 1)?.isOpen).toBe(true);
    // Sections with no backend render empty (FR-007).
    expect(result.business.policies).toEqual([]);
    expect(result.business.gallery).toEqual([]);
    expect(result.business.reviews).toEqual([]);
    expect(result.business.rating).toBeNull();
  });

  it('exposes no data for unknown, draft or suspended tenants', async () => {
    tenantMock.mockResolvedValueOnce({ ok: true, data: null });
    expect((await getPublicBusinessRemote('no-existe')).status).toBe('unavailable');

    tenantMock.mockResolvedValueOnce({ ok: true, data: makeTenantDto('draft') });
    const draft = await getPublicBusinessRemote('draft-shop');
    expect(draft.status).toBe('unavailable');
    if (draft.status === 'unavailable') expect(draft.reason).toBe('draft');

    tenantMock.mockResolvedValueOnce({ ok: true, data: makeTenantDto('suspended') });
    const suspended = await getPublicBusinessRemote('suspended-shop');
    expect(suspended.status).toBe('unavailable');
    if (suspended.status === 'unavailable') expect(suspended.reason).toBe('suspended');
  });

  it('renders empty sections when the API is unreachable (no fallback)', async () => {
    tenantMock.mockResolvedValueOnce({ ok: false, error: { code: 'STATE_ERROR', message: 'down' } });
    expect((await getPublicBusinessRemote('estudio-ana')).status).toBe('unavailable');
  });

  it('keeps the portal usable when specialists/availability fail', async () => {
    specialistsMock.mockResolvedValueOnce({ ok: false, error: { code: 'STATE_ERROR', message: 'x' } });
    availabilityMock.mockResolvedValueOnce({ ok: false, error: { code: 'STATE_ERROR', message: 'x' } });
    const result = await getPublicBusinessRemote('estudio-ana');
    expect(result.status).toBe('available');
    if (result.status !== 'available') return;
    expect(result.business.specialists).toEqual([]);
    expect(result.business.weeklyHours).toEqual([]);
  });

  it('derives weekly hours from tenant-level availability only', () => {
    expect(deriveWeeklyHours([])).toEqual([]);
    const hours = deriveWeeklyHours([makeRule({ weekday: 3 }), makeRule({ specialistId: 'res-ana', weekday: 5 })]);
    expect(hours).toHaveLength(7);
    expect(hours.find((day) => day.weekday === 3)?.isOpen).toBe(true);
    expect(hours.find((day) => day.weekday === 5)?.isOpen).toBe(false);
  });
});