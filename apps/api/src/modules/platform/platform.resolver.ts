import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireSuperAdmin } from './platform.decorators';
import { PlatformService } from './platform.service';
import {
  ManagedBusinessObject,
  OverrideTenantSubscriptionInput,
  PlatformMetricsObject,
} from './platform.types';

@Resolver()
export class PlatformResolver {
  constructor(private readonly service: PlatformService) {}

  /** Super Admin: global platform metrics. */
  @Query(() => PlatformMetricsObject)
  @RequireSuperAdmin()
  platformMetrics(): Promise<PlatformMetricsObject> {
    return this.service.getMetrics();
  }

  /** Super Admin: every business with its subscription state (bounded, searchable). */
  @Query(() => [ManagedBusinessObject])
  @RequireSuperAdmin()
  managedBusinesses(
    @Args('query', { type: () => String, nullable: true }) query?: string | null,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number | null,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number | null,
  ): Promise<ManagedBusinessObject[]> {
    return this.service.managedBusinesses({ query, limit, offset });
  }

  /** Super Admin: force any business's plan/status/expiry. */
  @Mutation(() => ManagedBusinessObject)
  @RequireSuperAdmin()
  overrideTenantSubscription(
    @Args('input', { type: () => OverrideTenantSubscriptionInput })
    input: OverrideTenantSubscriptionInput,
  ): Promise<ManagedBusinessObject> {
    return this.service.overrideSubscription(input);
  }
}
