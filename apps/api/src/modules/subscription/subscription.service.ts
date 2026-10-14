import { Inject, Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { planLimitError } from '../../shared/tenant-scope';
import type { AuthUser } from '../auth/jwt.types';
import {
  SUBSCRIPTION_STORE,
  type SubscriptionRow,
  type SubscriptionStore,
} from './subscription.store';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  type SubscriptionSummaryObject,
  type SubscriptionUsageObject,
} from './subscription.types';

const FREE_SERVICE_LIMIT = 1;
const FREE_TEAM_LIMIT = 1;

function scopeError(): GraphQLError {
  return new GraphQLError('Missing tenant scope', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

function usage(used: number, limit: number, unlimited: boolean): SubscriptionUsageObject {
  return { used, limit, unlimited };
}

/** Owns the subscription tier, the effective-plan rule and the count-based plan limits. */
@Injectable()
export class SubscriptionService {
  constructor(@Inject(SUBSCRIPTION_STORE) private readonly store: SubscriptionStore) {}

  /** Resolve the authoritative tenant scope from the authenticated identity (never client input). */
  requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw scopeError();
    }
    return user.tenantId;
  }

  /** Pure, fail-closed effective-plan rule (FR-003). */
  resolveEffectivePlan(row: SubscriptionRow | null): SubscriptionPlan {
    if (!row || row.plan !== SubscriptionPlan.PRO) {
      return SubscriptionPlan.FREE;
    }
    if (row.status !== SubscriptionStatus.active) {
      return SubscriptionPlan.FREE;
    }
    if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
      return SubscriptionPlan.FREE;
    }
    return SubscriptionPlan.PRO;
  }

  async getEffectivePlan(tenantId: string): Promise<SubscriptionPlan> {
    return this.resolveEffectivePlan(await this.store.getTenantSubscription(tenantId));
  }

  /** Reject an active service creation that would exceed the Free limit (FR-005). */
  async assertCanAddActiveService(tenantId: string): Promise<void> {
    if ((await this.getEffectivePlan(tenantId)) === SubscriptionPlan.PRO) {
      return;
    }
    const used = await this.store.countActive(tenantId, 'services');
    if (used >= FREE_SERVICE_LIMIT) {
      throw planLimitError(
        'The Free plan allows at most 1 active service. Upgrade to Pro for unlimited services.',
      );
    }
  }

  /** Reject activating a service that would exceed the Free limit (FR-006). */
  assertCanActivateService(tenantId: string): Promise<void> {
    return this.assertCanAddActiveService(tenantId);
  }

  /** Reject an active team-member creation that would exceed the Free limit (FR-007). */
  async assertCanAddActiveSpecialist(tenantId: string): Promise<void> {
    if ((await this.getEffectivePlan(tenantId)) === SubscriptionPlan.PRO) {
      return;
    }
    const used = await this.store.countActive(tenantId, 'team');
    if (used >= FREE_TEAM_LIMIT) {
      throw planLimitError(
        'The Free plan allows at most 1 active team member. Upgrade to Pro for unlimited members.',
      );
    }
  }

  /** Reject activating a team member that would exceed the Free limit (FR-008). */
  assertCanActivateSpecialist(tenantId: string): Promise<void> {
    return this.assertCanAddActiveSpecialist(tenantId);
  }

  /** Guard helper: reject unless the effective plan is one of the required tiers (FR-011). */
  async assertEffectivePlan(
    tenantId: string,
    required: readonly SubscriptionPlan[],
  ): Promise<void> {
    const plan = await this.getEffectivePlan(tenantId);
    if (!required.includes(plan)) {
      throw planLimitError('This feature requires the Pro plan.');
    }
  }

  /** Authenticated subscription summary with effective plan, status, expiry and usage (FR-013). */
  async getSummary(
    user: Pick<AuthUser, 'tenantId'> | undefined,
  ): Promise<SubscriptionSummaryObject> {
    const tenantId = this.requireTenant(user);
    const row = await this.store.getTenantSubscription(tenantId);
    const effectivePlan = this.resolveEffectivePlan(row);
    const isPro = effectivePlan === SubscriptionPlan.PRO;
    const [servicesUsed, teamUsed] = await Promise.all([
      this.store.countActive(tenantId, 'services'),
      this.store.countActive(tenantId, 'team'),
    ]);
    return {
      plan: row?.plan ?? SubscriptionPlan.FREE,
      effectivePlan,
      status: row?.status ?? SubscriptionStatus.active,
      expiresAt: row?.expiresAt ? row.expiresAt.toISOString() : null,
      limits: {
        services: usage(servicesUsed, isPro ? 0 : FREE_SERVICE_LIMIT, isPro),
        team: usage(teamUsed, isPro ? 0 : FREE_TEAM_LIMIT, isPro),
      },
    };
  }
}
