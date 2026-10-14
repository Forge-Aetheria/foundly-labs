import { beforeEach, describe, expect, it } from 'vitest';
import { SubscriptionPlan, SubscriptionStatus } from '../subscription/subscription.types';
import { createMemoryIdentityClient, type UserStats } from './platform.identity';
import { PlatformService } from './platform.service';
import { createMemoryPlatformStore, type MemoryPlatformStore } from './platform.test-store';

function makeService(
  stats: UserStats | null = null,
): { service: PlatformService; store: MemoryPlatformStore } {
  const store = createMemoryPlatformStore();
  const service = new PlatformService(store, createMemoryIdentityClient(stats));
  return { service, store };
}

describe('PlatformService (019-super-admin-panel)', () => {
  describe('US1 — global metrics', () => {
    it('reports business counts, plan distribution and PRO conversion', async () => {
      const { service, store } = makeService({ total: 5, active: 3 });
      store.seed({ tenantId: 't1', slug: 'ana', name: 'Ana', plan: SubscriptionPlan.FREE, status: SubscriptionStatus.active, expiresAt: null });
      store.seed({ tenantId: 't2', slug: 'rona', name: 'Rona', plan: SubscriptionPlan.PRO, status: SubscriptionStatus.active, expiresAt: null });
      store.seed({ tenantId: 't3', slug: 'luis', name: 'Luis', plan: SubscriptionPlan.PRO, status: SubscriptionStatus.active, expiresAt: null }, 'suspended');

      const metrics = await service.getMetrics();
      expect(metrics.businesses).toEqual({ total: 3, active: 2 });
      expect(metrics.plans).toEqual({ free: 1, pro: 2 });
      expect(metrics.proConversion).toBeCloseTo(2 / 3, 5);
      expect(metrics.users).toEqual({ available: true, total: 5, active: 3 });
    });

    it('degrades the user metric when the identity source is unavailable', async () => {
      const { service } = makeService(null);
      const metrics = await service.getMetrics();
      expect(metrics.users).toEqual({ available: false, total: null, active: null });
      expect(metrics.businesses).toEqual({ total: 0, active: 0 });
      expect(metrics.proConversion).toBe(0);
    });
  });

  describe('US2 — forced subscription override', () => {
    it('grants PRO with a future expiry (partial-friendly)', async () => {
      const { service, store } = makeService();
      store.seed({ tenantId: 't1', slug: 'ana', name: 'Ana', plan: SubscriptionPlan.FREE, status: SubscriptionStatus.active, expiresAt: null });
      const result = await service.overrideSubscription({
        tenantId: 't1',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.active,
        expiresAt: '2027-01-01T00:00:00.000Z',
      });
      expect(result.plan).toBe(SubscriptionPlan.PRO);
      expect(result.expiresAt).toBe('2027-01-01T00:00:00.000Z');
    });

    it('changes only the provided fields', async () => {
      const { service, store } = makeService();
      store.seed({ tenantId: 't1', slug: 'ana', name: 'Ana', plan: SubscriptionPlan.PRO, status: SubscriptionStatus.active, expiresAt: new Date('2027-01-01T00:00:00.000Z') });
      const result = await service.overrideSubscription({ tenantId: 't1', status: SubscriptionStatus.canceled });
      expect(result.plan).toBe(SubscriptionPlan.PRO);
      expect(result.status).toBe(SubscriptionStatus.canceled);
      expect(result.expiresAt).toBe('2027-01-01T00:00:00.000Z');
    });

    it('clears the expiry when expiresAt is null', async () => {
      const { service, store } = makeService();
      store.seed({ tenantId: 't1', slug: 'ana', name: 'Ana', plan: SubscriptionPlan.PRO, status: SubscriptionStatus.active, expiresAt: new Date('2027-01-01T00:00:00.000Z') });
      const result = await service.overrideSubscription({ tenantId: 't1', expiresAt: null });
      expect(result.expiresAt).toBeNull();
    });

    it('revokes PRO by setting FREE', async () => {
      const { service, store } = makeService();
      store.seed({ tenantId: 't1', slug: 'ana', name: 'Ana', plan: SubscriptionPlan.PRO, status: SubscriptionStatus.active, expiresAt: null });
      const result = await service.overrideSubscription({ tenantId: 't1', plan: SubscriptionPlan.FREE });
      expect(result.plan).toBe(SubscriptionPlan.FREE);
    });

    it('rejects unknown tenants with NOT_FOUND', async () => {
      const { service } = makeService();
      await expect(
        service.overrideSubscription({ tenantId: 'nope', plan: SubscriptionPlan.PRO }),
      ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
    });

    it('rejects invalid input with VALIDATION_ERROR and changes nothing', async () => {
      const { service, store } = makeService();
      store.seed({ tenantId: 't1', slug: 'ana', name: 'Ana', plan: SubscriptionPlan.FREE, status: SubscriptionStatus.active, expiresAt: null });
      await expect(
        service.overrideSubscription({ tenantId: 't1', expiresAt: 'not-a-date' }),
      ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
      expect(store.getRow('t1')?.plan).toBe(SubscriptionPlan.FREE);
    });
  });

  describe('US4 — managed businesses list', () => {
    beforeEach(() => {
      // no-op: each test builds its own store via makeService
    });

    it('lists all businesses ordered by name with subscription state', async () => {
      const { service, store } = makeService();
      store.seed({ tenantId: 't2', slug: 'rona', name: 'Rona', plan: SubscriptionPlan.PRO, status: SubscriptionStatus.active, expiresAt: null });
      store.seed({ tenantId: 't1', slug: 'ana', name: 'Ana', plan: SubscriptionPlan.FREE, status: SubscriptionStatus.expired, expiresAt: null });
      const rows = await service.managedBusinesses({});
      expect(rows.map((row) => row.name)).toEqual(['Ana', 'Rona']);
      expect(rows[0]).toMatchObject({ plan: SubscriptionPlan.FREE, status: SubscriptionStatus.expired });
    });

    it('filters by name/slug case-insensitively and returns [] for no match', async () => {
      const { service, store } = makeService();
      store.seed({ tenantId: 't1', slug: 'estudio-ana', name: 'Estudio Ana', plan: SubscriptionPlan.FREE, status: SubscriptionStatus.active, expiresAt: null });
      await expect(service.managedBusinesses({ query: 'ANA' })).resolves.toHaveLength(1);
      await expect(service.managedBusinesses({ query: 'zzz' })).resolves.toEqual([]);
    });

    it('applies default/max limit and offset validation', async () => {
      const { service, store } = makeService();
      for (let i = 0; i < 5; i += 1) {
        store.seed({ tenantId: `t${i}`, slug: `s${i}`, name: `B${i}`, plan: SubscriptionPlan.FREE, status: SubscriptionStatus.active, expiresAt: null });
      }
      await expect(service.managedBusinesses({ limit: 2, offset: 1 })).resolves.toHaveLength(2);
      await expect(service.managedBusinesses({ limit: 0 })).rejects.toMatchObject({
        extensions: { code: 'VALIDATION_ERROR' },
      });
      await expect(service.managedBusinesses({ offset: -1 })).rejects.toMatchObject({
        extensions: { code: 'VALIDATION_ERROR' },
      });
    });
  });

  describe('US3 — Super Admin predicate', () => {
    it('recognizes the platform role and the email allowlist', () => {
      const { service } = makeService();
      expect(service.isSuperAdmin({ platformRole: 'super_admin' })).toBe(true);
      expect(service.isSuperAdmin({ platformRole: 'user' })).toBe(false);
      process.env.PLATFORM_ADMIN_EMAILS = 'owner@foundly.dev';
      expect(service.isSuperAdmin({ email: 'Owner@Foundly.dev' })).toBe(true);
      expect(service.isSuperAdmin({ email: 'other@foundly.dev' })).toBe(false);
      delete process.env.PLATFORM_ADMIN_EMAILS;
    });

    it('fails closed: anonymous → UNAUTHENTICATED, non-admin → FORBIDDEN', () => {
      const { service } = makeService();
      expect(() => service.requireSuperAdmin(undefined)).toThrowError(
        expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
      );
      expect(() => service.requireSuperAdmin({ email: 'nope@foundly.dev' })).toThrowError(
        expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }),
      );
    });
  });
});
