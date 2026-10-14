import { beforeEach, describe, expect, it } from 'vitest';
import { SubscriptionService } from './subscription.service';
import {
  createMemorySubscriptionStore,
  type MemorySubscriptionStore,
} from './subscription.test-store';
import type { SubscriptionRow } from './subscription.store';
import { SubscriptionPlan, SubscriptionStatus } from './subscription.types';

const T1 = 'tenant-1';

function row(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    tenantId: T1,
    plan: SubscriptionPlan.FREE,
    status: SubscriptionStatus.active,
    expiresAt: null,
    ...overrides,
  };
}

function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  return expect(promise).rejects.toThrowError(
    expect.objectContaining({ extensions: { code } }),
  );
}

describe('SubscriptionService (017-subscription-plans)', () => {
  let store: MemorySubscriptionStore;
  let service: SubscriptionService;

  beforeEach(() => {
    store = createMemorySubscriptionStore();
    service = new SubscriptionService(store);
  });

  describe('US1 — effective plan (fail-closed)', () => {
    it('treats a missing subscription as Free', () => {
      expect(service.resolveEffectivePlan(null)).toBe(SubscriptionPlan.FREE);
    });

    it('is Pro only when plan is PRO, status is active and not expired', () => {
      expect(service.resolveEffectivePlan(row({ plan: SubscriptionPlan.PRO }))).toBe(
        SubscriptionPlan.PRO,
      );
      const future = new Date(Date.now() + 86_400_000);
      expect(
        service.resolveEffectivePlan(row({ plan: SubscriptionPlan.PRO, expiresAt: future })),
      ).toBe(SubscriptionPlan.PRO);
    });

    it('falls back to Free for Free, past-due, canceled and expired subscriptions', () => {
      expect(service.resolveEffectivePlan(row({ plan: SubscriptionPlan.FREE }))).toBe(
        SubscriptionPlan.FREE,
      );
      expect(
        service.resolveEffectivePlan(row({ plan: SubscriptionPlan.PRO, status: SubscriptionStatus.past_due })),
      ).toBe(SubscriptionPlan.FREE);
      expect(
        service.resolveEffectivePlan(row({ plan: SubscriptionPlan.PRO, status: SubscriptionStatus.canceled })),
      ).toBe(SubscriptionPlan.FREE);
      const past = new Date(Date.now() - 1_000);
      expect(
        service.resolveEffectivePlan(row({ plan: SubscriptionPlan.PRO, expiresAt: past })),
      ).toBe(SubscriptionPlan.FREE);
    });

    it('rejects a summary read without tenant scope', async () => {
      await expectCode(service.getSummary(undefined), 'UNAUTHENTICATED');
      await expectCode(service.getSummary({ tenantId: undefined }), 'UNAUTHENTICATED');
    });
  });

  describe('US2/US3 — count-based limits', () => {
    it('allows the first active service and blocks the second on Free', async () => {
      await expect(service.assertCanAddActiveService(T1)).resolves.toBeUndefined();
      store.seedService(T1, true);
      await expectCode(service.assertCanAddActiveService(T1), 'PLAN_LIMIT_REACHED');
    });

    it('counts only active records when enforcing', async () => {
      store.seedService(T1, false);
      await expect(service.assertCanAddActiveService(T1)).resolves.toBeUndefined();
    });

    it('blocks the second active team member on Free', async () => {
      await expect(service.assertCanAddActiveSpecialist(T1)).resolves.toBeUndefined();
      store.seedSpecialist(T1, true);
      await expectCode(service.assertCanAddActiveSpecialist(T1), 'PLAN_LIMIT_REACHED');
    });

    it('does not limit an effective Pro tenant', async () => {
      store.seedTenant(row({ plan: SubscriptionPlan.PRO }));
      store.seedService(T1, true);
      store.seedSpecialist(T1, true);
      await expect(service.assertCanAddActiveService(T1)).resolves.toBeUndefined();
      await expect(service.assertCanAddActiveSpecialist(T1)).resolves.toBeUndefined();
    });
  });

  describe('US4 — effective-plan gate', () => {
    it('rejects a Free tenant and allows a Pro tenant', async () => {
      await expectCode(
        service.assertEffectivePlan(T1, [SubscriptionPlan.PRO]),
        'PLAN_LIMIT_REACHED',
      );
      store.seedTenant(row({ plan: SubscriptionPlan.PRO }));
      await expect(
        service.assertEffectivePlan(T1, [SubscriptionPlan.PRO]),
      ).resolves.toBeUndefined();
    });
  });

  describe('US5 — summary usage', () => {
    it('reports Free usage against a limit of 1', async () => {
      store.seedTenant(row());
      store.seedService(T1, true);
      store.seedService(T1, false);
      store.seedSpecialist(T1, true);
      const summary = await service.getSummary({ tenantId: T1 });
      expect(summary.effectivePlan).toBe(SubscriptionPlan.FREE);
      expect(summary.limits.services).toEqual({ used: 1, limit: 1, unlimited: false });
      expect(summary.limits.team).toEqual({ used: 1, limit: 1, unlimited: false });
    });

    it('reports unlimited usage for an effective Pro tenant', async () => {
      store.seedTenant(row({ plan: SubscriptionPlan.PRO }));
      store.seedService(T1, true);
      const summary = await service.getSummary({ tenantId: T1 });
      expect(summary.effectivePlan).toBe(SubscriptionPlan.PRO);
      expect(summary.limits.services).toEqual({ used: 1, limit: 0, unlimited: true });
      expect(summary.limits.team).toEqual({ used: 0, limit: 0, unlimited: true });
    });

    it('reports Free limits for an expired Pro subscription', async () => {
      store.seedTenant(
        row({ plan: SubscriptionPlan.PRO, expiresAt: new Date(Date.now() - 1_000) }),
      );
      const summary = await service.getSummary({ tenantId: T1 });
      expect(summary.effectivePlan).toBe(SubscriptionPlan.FREE);
      expect(summary.plan).toBe(SubscriptionPlan.PRO);
      expect(summary.limits.services).toEqual({ used: 0, limit: 1, unlimited: false });
    });
  });
});
