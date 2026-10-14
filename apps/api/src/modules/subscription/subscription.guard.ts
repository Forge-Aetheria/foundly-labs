import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphQLContext } from '../../graphql/context';
import { unauthError } from '../auth/auth.guards';
import { SubscriptionService } from './subscription.service';
import type { SubscriptionPlan } from './subscription.types';

export const REQUIRED_SUBSCRIPTION_KEY = 'foundly:requiredSubscriptionPlans';

/**
 * Enforces the subscription tier on Pro-gated operations. Distinct from the module-license
 * `PlanGuard`/`@RequirePlan`; this guard reads the required tiers from metadata and delegates the
 * fail-closed effective-plan decision to `SubscriptionService`.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<SubscriptionPlan[]>(REQUIRED_SUBSCRIPTION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (required.length === 0) {
      return true;
    }
    const user = GqlExecutionContext.create(context).getContext<GraphQLContext>().user;
    if (!user?.tenantId) {
      throw unauthError();
    }
    await this.subscriptionService.assertEffectivePlan(user.tenantId, required);
    return true;
  }
}
