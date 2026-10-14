import { describe, expect, it } from 'vitest';
import { SubscriptionResolver } from './subscription.resolver';
import { SubscriptionService } from './subscription.service';
import { createMemorySubscriptionStore } from './subscription.test-store';
import { SubscriptionPlan, SubscriptionStatus } from './subscription.types';

function make(): { resolver: SubscriptionResolver; store: ReturnType<typeof createMemorySubscriptionStore> } {
  const store = createMemorySubscriptionStore();
  const resolver = new SubscriptionResolver(new SubscriptionService(store));
  return { resolver, store };
}

describe('SubscriptionResolver.mySubscription (017-subscription-plans)', () => {
  it('reports the default Free subscription for a new business', async () => {
    const { resolver } = make();
    const summary = await resolver.mySubscription({ sub: 'u1', role: 'owner', aud: 'x', exp: 0, tenantId: 't1' });
    expect(summary.plan).toBe(SubscriptionPlan.FREE);
    expect(summary.effectivePlan).toBe(SubscriptionPlan.FREE);
    expect(summary.expiresAt).toBeNull();
  });

  it('reports Pro for a Pro subscription', async () => {
    const { resolver, store } = make();
    store.seedTenant({
      tenantId: 't1',
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.active,
      expiresAt: null,
    });
    const summary = await resolver.mySubscription({ sub: 'u1', role: 'owner', aud: 'x', exp: 0, tenantId: 't1' });
    expect(summary.effectivePlan).toBe(SubscriptionPlan.PRO);
    expect(summary.limits.services.unlimited).toBe(true);
  });

  it('rejects a caller without tenant scope', async () => {
    const { resolver } = make();
    await expect(
      resolver.mySubscription({ sub: 'u1', role: 'owner', aud: 'x', exp: 0 }),
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });

  it('never leaks another tenant usage', async () => {
    const { resolver, store } = make();
    store.seedTenant({
      tenantId: 't1',
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.active,
      expiresAt: null,
    });
    const summary = await resolver.mySubscription({ sub: 'u2', role: 'owner', aud: 'x', exp: 0, tenantId: 't2' });
    expect(summary.effectivePlan).toBe(SubscriptionPlan.FREE);
  });
});
