import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AvailabilityDocument,
  SpecialistsDocument,
  TenantBySlugDocument,
} from '../../../shared/api/generated';
import { getPublicBusinessRemote } from '../actions';
import { deriveWeeklyHours } from '../utils/availability';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock('../../../shared/api/client', () => ({ apiRequest: (...args: unknown[]) => apiMock(...args) }));

function makeTenant(status = 'active') {
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
        id: 'svc-off',
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

function makeRule(overrides: Record<string, unknown> = {}) {
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

function makeSpecialist() {
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

describe('public-booking queries (feature 011 — server-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.mockImplementation(async (document: unknown) => {
      if (document === TenantBySlugDocument) return { ok: true, data: { tenant: makeTenant() } };
      if (document === SpecialistsDocument) return { ok: true, data: { specialists: [makeSpecialist()] } };
      if (document === AvailabilityDocument) return { ok: true, data: { availability: [makeRule()] } };
      return { ok: false, error: { code: 'STATE_ERROR', message: 'unexpected' } };
    });
  });

  it('resolves an active tenant with API services, specialists and availability', async () => {
    const result = await getPublicBusinessRemote('estudio-ana');
    expect(result.status).toBe('available');
    if (result.status !== 'available') return;
    expect(result.business.name).toBe('Estudio Ana');
    expect(result.business.services.map((service) => service.id)).toEqual(['svc-corte']);
    expect(result.business.specialists[0]?.services).toEqual(['Corte de cabello']);
    expect(result.business.weeklyHours).toHaveLength(7);
    expect(result.business.policies).toEqual([]);
    expect(result.business.gallery).toEqual([]);
    expect(result.business.reviews).toEqual([]);
    expect(result.business.rating).toBeNull();
  });

  it('exposes no data for unknown, draft or suspended tenants', async () => {
    apiMock.mockResolvedValueOnce({ ok: true, data: { tenant: null } });
    expect((await getPublicBusinessRemote('no-existe')).status).toBe('unavailable');

    apiMock.mockResolvedValueOnce({ ok: true, data: { tenant: makeTenant('draft') } });
    const draft = await getPublicBusinessRemote('draft-shop');
    expect(draft.status).toBe('unavailable');
    if (draft.status === 'unavailable') expect(draft.reason).toBe('draft');

    apiMock.mockResolvedValueOnce({ ok: true, data: { tenant: makeTenant('suspended') } });
    const suspended = await getPublicBusinessRemote('suspended-shop');
    expect(suspended.status).toBe('unavailable');
    if (suspended.status === 'unavailable') expect(suspended.reason).toBe('suspended');
  });

  it('renders empty when the API is unreachable (no fallback)', async () => {
    apiMock.mockResolvedValueOnce({ ok: false, error: { code: 'STATE_ERROR', message: 'down' } });
    expect((await getPublicBusinessRemote('estudio-ana')).status).toBe('unavailable');
  });

  it('keeps the portal usable when specialists/availability fail', async () => {
    apiMock.mockImplementation(async (document: unknown) => {
      if (document === TenantBySlugDocument) return { ok: true, data: { tenant: makeTenant() } };
      return { ok: false, error: { code: 'STATE_ERROR', message: 'x' } };
    });
    const result = await getPublicBusinessRemote('estudio-ana');
    expect(result.status).toBe('available');
    if (result.status !== 'available') return;
    expect(result.business.specialists).toEqual([]);
    expect(result.business.weeklyHours).toEqual([]);
  });

  it('derives weekly hours from tenant-level availability only', () => {
    expect(deriveWeeklyHours([])).toEqual([]);
    const hours = deriveWeeklyHours([
      makeRule({ weekday: 3 }),
      makeRule({ specialistId: 'res-ana', weekday: 5 }),
    ]);
    expect(hours).toHaveLength(7);
    expect(hours.find((day) => day.weekday === 3)?.isOpen).toBe(true);
    expect(hours.find((day) => day.weekday === 5)?.isOpen).toBe(false);
  });
});