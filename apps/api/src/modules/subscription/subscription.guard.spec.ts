import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { SubscriptionGuard, REQUIRED_SUBSCRIPTION_KEY } from './subscription.guard';
import { SubscriptionService } from './subscription.service';
import { createMemorySubscriptionStore } from './subscription.test-store';
import { SubscriptionPlan, SubscriptionStatus } from './subscription.types';

interface UserLike {
  sub: string;
  role: string;
  aud: string;
  exp: number;
  tenantId?: string;
}

function contextFor(handler: () => void, klass: new () => unknown, user?: UserLike): ExecutionContext {
  return {
    getType: () => 'graphql',
    getHandler: () => handler,
    getClass: () => klass,
    getArgs: () => [undefined, undefined, { user }, undefined],
  } as unknown as ExecutionContext;
}

function guard(
  store = createMemorySubscriptionStore(),
): { guard: SubscriptionGuard; store: ReturnType<typeof createMemorySubscriptionStore> } {
  return { guard: new SubscriptionGuard(new Reflector(), new SubscriptionService(store)), store };
}

describe('SubscriptionGuard (017-subscription-plans)', () => {
  it('passes when no subscription is required', async () => {
    class Stub {
      handler(): void {}
    }
    const { guard: g } = guard();
    expect(await g.canActivate(contextFor(Stub.prototype.handler, Stub, { sub: 'u', role: 'owner', aud: 'x', exp: 0 }))).toBe(true);
  });

  it('rejects a Free (effective) tenant with PLAN_LIMIT_REACHED', async () => {
    class Stub {
      @SetMetadata(REQUIRED_SUBSCRIPTION_KEY, [SubscriptionPlan.PRO])
      handler(): void {}
    }
    const { guard: g } = guard();
    await expect(
      g.canActivate(contextFor(Stub.prototype.handler, Stub, { sub: 'u', role: 'owner', aud: 'x', exp: 0, tenantId: 't1' })),
    ).rejects.toMatchObject({ extensions: { code: 'PLAN_LIMIT_REACHED' } });
  });

  it('passes for an effective Pro tenant', async () => {
    class Stub {
      @SetMetadata(REQUIRED_SUBSCRIPTION_KEY, [SubscriptionPlan.PRO])
      handler(): void {}
    }
    const { guard: g, store } = guard();
    store.seedTenant({
      tenantId: 't1',
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.active,
      expiresAt: null,
    });
    expect(
      await g.canActivate(contextFor(Stub.prototype.handler, Stub, { sub: 'u', role: 'owner', aud: 'x', exp: 0, tenantId: 't1' })),
    ).toBe(true);
  });

  it('rejects an unauthenticated caller with UNAUTHENTICATED', async () => {
    class Stub {
      @SetMetadata(REQUIRED_SUBSCRIPTION_KEY, [SubscriptionPlan.PRO])
      handler(): void {}
    }
    const { guard: g } = guard();
    await expect(
      g.canActivate(contextFor(Stub.prototype.handler, Stub)),
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
