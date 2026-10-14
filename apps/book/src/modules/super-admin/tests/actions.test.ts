import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ManagedBusinessesDocument,
  OverrideTenantSubscriptionDocument,
  PlatformMetricsDocument,
} from '../../../shared/api/generated';
import {
  getManagedBusinesses,
  getPlatformMetrics,
  overrideSubscription,
} from '../actions';

const { adminMock } = vi.hoisted(() => ({ adminMock: vi.fn() }));
vi.mock('../../../shared/api/admin-request', () => ({
  apiRequestAdmin: (...args: unknown[]) => adminMock(...args),
}));

const metricsData = {
  platformMetrics: {
    businesses: { total: 12, active: 9 },
    users: { available: true, total: 40, active: 30 },
    plans: { free: 7, pro: 5 },
    proConversion: 5 / 12,
  },
};

function business(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 't1',
    slug: 'estudio-ana',
    name: 'Estudio Ana',
    plan: 'FREE',
    status: 'active',
    expiresAt: null,
    ...overrides,
  };
}

describe('super-admin actions (020)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps platform metrics', async () => {
    adminMock.mockResolvedValue({ ok: true, data: metricsData });
    const result = await getPlatformMetrics();
    expect(adminMock).toHaveBeenCalledWith(PlatformMetricsDocument, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      businessesTotal: 12,
      businessesActive: 9,
      usersTotal: 40,
      usersActive: 30,
      usersAvailable: true,
      plansFree: 7,
      plansPro: 5,
    });
  });

  it('maps managed businesses (null-safe)', async () => {
    adminMock.mockResolvedValue({
      ok: true,
      data: { managedBusinesses: [business({ plan: 'PRO', status: 'expired', expiresAt: '2027-01-01T00:00:00.000Z' })] },
    });
    const result = await getManagedBusinesses({ query: '  ana ', limit: 20, offset: 0 });
    expect(adminMock).toHaveBeenCalledWith(ManagedBusinessesDocument, {
      query: 'ana',
      limit: 20,
      offset: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[0]).toEqual({
      tenantId: 't1',
      slug: 'estudio-ana',
      name: 'Estudio Ana',
      plan: 'PRO',
      status: 'expired',
      expiresAt: '2027-01-01T00:00:00.000Z',
    });
  });

  it('returns the read failure unchanged', async () => {
    adminMock.mockResolvedValue({ ok: false, error: { code: 'FORBIDDEN', message: 'nope' } });
    expect(await getPlatformMetrics()).toEqual({
      ok: false,
      error: { code: 'FORBIDDEN', message: 'nope' },
    });
  });

  it('sends only the changed fields on a partial override', async () => {
    adminMock.mockResolvedValue({ ok: true, data: { overrideTenantSubscription: business({ plan: 'PRO' }) } });
    const result = await overrideSubscription({ tenantId: 't1', plan: 'PRO' });
    expect(adminMock).toHaveBeenCalledWith(OverrideTenantSubscriptionDocument, {
      input: { tenantId: 't1', plan: 'PRO' },
    });
    expect(result.ok).toBe(true);
  });

  it('clears the expiry when expiresAt is null', async () => {
    adminMock.mockResolvedValue({ ok: true, data: { overrideTenantSubscription: business() } });
    await overrideSubscription({ tenantId: 't1', expiresAt: null });
    expect(adminMock).toHaveBeenCalledWith(OverrideTenantSubscriptionDocument, {
      input: { tenantId: 't1', expiresAt: null },
    });
  });

  it('rejects an override with no changed field (VALIDATION_ERROR, no call)', async () => {
    const result = await overrideSubscription({ tenantId: 't1' });
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    expect(adminMock).not.toHaveBeenCalled();
  });
});
