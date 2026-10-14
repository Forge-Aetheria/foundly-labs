import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { TenantsService } from './tenants.service';
import {
  BusinessSummaryObject,
  CreateTenantInput,
  TenantObject,
  UpdateBusinessProfileInput,
} from './tenants.types';

@Resolver(() => TenantObject)
export class TenantsResolver {
  constructor(private readonly tenantsService: TenantsService) {}

  @Query(() => [TenantObject])
  tenants(): Promise<TenantObject[]> {
    return this.tenantsService.findAll();
  }

  @Query(() => TenantObject, { nullable: true })
  tenant(@Args('slug') slug: string): Promise<TenantObject | null> {
    return this.tenantsService.findBySlug(slug);
  }

  /** Public discovery directory: active, eligible businesses with an optional text search (018). */
  @Query(() => [BusinessSummaryObject])
  searchBusinesses(
    @Args('query', { type: () => String, nullable: true }) query?: string | null,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number | null,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number | null,
  ): Promise<BusinessSummaryObject[]> {
    return this.tenantsService.searchBusinesses({ query, limit, offset });
  }

  @Mutation(() => TenantObject)
  createTenant(@Args('input') input: CreateTenantInput): Promise<TenantObject> {
    return this.tenantsService.create(input);
  }

  /** Update the authenticated owner's business identity + profile (feature 013). */
  @Mutation(() => TenantObject)
  @RequireAuth()
  updateMyBusinessProfile(
    @AuthUserDecorator() user: AuthUser,
    @Args('input', { type: () => UpdateBusinessProfileInput }) input: UpdateBusinessProfileInput,
  ): Promise<TenantObject> {
    return this.tenantsService.updateProfile(user, input);
  }
}
