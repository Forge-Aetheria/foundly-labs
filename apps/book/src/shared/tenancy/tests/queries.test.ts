import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyBusinessDocument } from '../../api/generated';
import { getCurrentTenant } from '../queries';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock('../../api/authed-request', () => ({
  apiRequestAuthed: (...args: unknown[]) => apiMock(...args),
}));

function makeTenant(id: string, slug: string) {
  return {
    id,
    name: `Negocio ${slug}`,
    category: 'Salon',
    tags: [],
    status: 'active',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    isPublic: true,
    profile: {
      slug,
      bio: null,
      address: null,
      phone: null,
      instagram: null,
      whatsapp: null,
      logo: null,
      cover: null,
      policies: [],
    },
    services: [],
  };
}

describe('tenancy queries (feature 011 — authenticated workspace)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the business resolved by the server via myBusiness', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { myBusiness: makeTenant('ten-ana', 'estudio-ana') } });
    const result = await getCurrentTenant();
    expect(apiMock).toHaveBeenCalledWith(MyBusinessDocument, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('ten-ana');
      expect(result.data.slug).toBe('estudio-ana');
    }
  });

  it('never sends a tenantId to resolve the workspace', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { myBusiness: makeTenant('ten-b', 'b-shop') } });
    const result = await getCurrentTenant();
    expect(apiMock).toHaveBeenCalledWith(MyBusinessDocument, {});
    expect(result.ok && result.data.id).toBe('ten-b');
  });

  it('surfaces FORBIDDEN without inventing a workspace', async () => {
    apiMock.mockResolvedValue({
      ok: false,
      error: { code: 'FORBIDDEN', message: 'Tenant is not active' },
    });
    const result = await getCurrentTenant();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
  });

  it('surfaces NOT_FOUND for a missing business', async () => {
    apiMock.mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Business not found' },
    });
    const result = await getCurrentTenant();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });
});
