import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/jwt.guard';
import { REQUIRED_SUBSCRIPTION_KEY, SubscriptionGuard } from './subscription.guard';
import type { SubscriptionPlan } from './subscription.types';

/**
 * Require an effective subscription tier for a Pro-gated operation. Applies JWT verification first,
 * then the subscription tier check (the tier guard needs the verified `ctx.user`).
 */
export function RequiresSubscription(...plans: SubscriptionPlan[]): MethodDecorator {
  return applyDecorators(
    SetMetadata(REQUIRED_SUBSCRIPTION_KEY, plans),
    UseGuards(SupabaseJwtGuard, SubscriptionGuard),
  );
}
