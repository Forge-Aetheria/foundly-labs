import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TenantsService } from './tenants.service';
import { CreateTenantInput, TenantObject } from './tenants.types';

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
}
