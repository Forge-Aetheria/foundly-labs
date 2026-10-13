import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { TenantsService } from './tenants.service';
import { CreateTenantInput, TenantObject, UpdateBusinessProfileInput } from './tenants.types';

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
