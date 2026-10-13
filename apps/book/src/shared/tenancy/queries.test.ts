import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '../auth/auth';
import { getCurrentTenant } from './queries';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock('../api/client', () => ({ apiRequest: (...args: unknown[]) => apiMock(...args) }));

function makeTenant(id: string, slug: string) {
  return {
    id,
    name: `Negocio ${slug}`,
    category: 'Salón',
    status: 'active',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    profile: {
      slug,
      bio: null,
      address: null,
      phone: null,
      instagram: null,
      whatsapp: null,
      logo: null,
      cover: null,
    },
    services: [],
  };
}

describe('tenancy queries (feature 011 — server-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the session tenant from the API', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { tenants: [makeTenant('ten-ana', 'estudio-ana')] } });
    const session: Session = { userId: 'u', role: 'admin', tenantId: 'ten-ana' };
    const result = await getCurrentTenant(session);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('ten-ana');
      expect(result.data.slug).toBe('estudio-ana');
    }
  });

  it('scopes resolution to the bound tenant (cross-tenant isolation)', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: { tenants: [makeTenant('ten-ana', 'estudio-ana'), makeTenant('ten-b', 'b-shop')] },
    });
    const a = await getCurrentTenant({ userId: 'a', role: 'admin', tenantId: 'ten-ana' });
    const b = await getCurrentTenant({ userId: 'b', role: 'admin', tenantId: 'ten-b' });
    expect(a.ok && a.data.id).toBe('ten-ana');
    expect(b.ok && b.data.id).toBe('ten-b');
    expect(b.ok && b.data.slug).toBe('b-shop');
  });

  it('surfaces NOT_FOUND when the API has no tenant', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { tenants: [] } });
    const result = await getCurrentTenant({ userId: 'x', role: 'admin', tenantId: 'ten-missing' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects sessions without a tenant', async () => {
    const result = await getCurrentTenant({ userId: 'x', role: 'admin' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('rejects null sessions', async () => {
    const result = await getCurrentTenant(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });
});