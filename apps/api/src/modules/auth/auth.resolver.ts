import { Query, Resolver } from '@nestjs/graphql';
import type { AuthContext, AuthTenant } from './auth.context';
import { CurrentTenant, CurrentUser, RequirePlan, UseAuth } from './auth.decorators';
import { BookCapabilityObject, CurrentTenantObject, CurrentUserObject } from './auth.types';

@Resolver()
export class AuthResolver {
  @Query(() => CurrentUserObject)
  @UseAuth()
  me(@CurrentUser() context: AuthContext): CurrentUserObject {
    return {
      userId: context.userId,
      role: context.role,
      tenant: {
        id: context.tenant.id,
        status: context.tenant.status,
        plan: context.tenant.plan,
      },
    };
  }

  @Query(() => CurrentTenantObject)
  @UseAuth()
  currentTenant(@CurrentTenant() tenant: AuthTenant): CurrentTenantObject {
    return {
      id: tenant.id,
      status: tenant.status,
      plan: tenant.plan,
    };
  }

  @Query(() => BookCapabilityObject)
  @RequirePlan('book')
  bookCapability(@CurrentTenant() tenant: AuthTenant): BookCapabilityObject {
    return { tenantId: tenant.id, enabled: true };
  }
}
