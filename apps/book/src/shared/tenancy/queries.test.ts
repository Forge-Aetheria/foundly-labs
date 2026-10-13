import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '../infra/auth';
import type { TenantDto } from '../infra/remoteTenancy';
import { getCurrentTenant } from './queries';

const { fetchTenantByIdMock } = vi.hoisted(() => ({ fetchTenantByIdMock: vi.fn() }));

vi.mock('../infra/remoteTenancy', () => ({
  fetchTenantById: (...args: unknown[]) => fetchTenantByIdMock(...args),
}));

function makeTenantDto(id: string, slug: string): TenantDto {
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

describe('tenancy queries (SC-008, contracts/routes.contract.md — server-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the session tenant from the API', async () => {
    fetchTenantByIdMock.mockResolvedValue({ ok: true, data: makeTenantDto('ten-ana', 'estudio-ana') });
    const session: Session = { userId: 'u-owner-ana', role: 'admin', tenantId: 'ten-ana' };
    const result = await getCurrentTenant(session);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('ten-ana');
      expect(result.data.slug).toBe('estudio-ana');
    }
  });

  it('scopes resolution to the bound tenant (cross-tenant isolation)', async () => {
    fetchTenantByIdMock.mockImplementation(async (tenantId: string) =>
      tenantId === 'ten-b'
        ? { ok: true, data: makeTenantDto('ten-b', 'b-shop') }
        : { ok: true, data: makeTenantDto('ten-ana', 'estudio-ana') },
    );

    const sessionA: Session = { userId: 'u-a', role: 'admin', tenantId: 'ten-ana' };
    const sessionB: Session = { userId: 'u-b', role: 'admin', tenantId: 'ten-b' };

    const a = await getCurrentTenant(sessionA);
    const b = await getCurrentTenant(sessionB);
    expect(a.ok && a.data.id).toBe('ten-ana');
    expect(b.ok && b.data.id).toBe('ten-b');
    expect(b.ok && b.data.slug).toBe('b-shop');
  });

  it('surfaces NOT_FOUND when the API has no tenant', async () => {
    fetchTenantByIdMock.mockResolvedValue({ ok: true, data: null });
    const session: Session = { userId: 'u-x', role: 'admin', tenantId: 'ten-missing' };
    const result = await getCurrentTenant(session);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects sessions without a tenant', async () => {
    const session: Session = { userId: 'u-x', role: 'admin' };
    const result = await getCurrentTenant(session);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
    expect(fetchTenantByIdMock).not.toHaveBeenCalled();
  });

  it('rejects null sessions', async () => {
    const result = await getCurrentTenant(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });
});