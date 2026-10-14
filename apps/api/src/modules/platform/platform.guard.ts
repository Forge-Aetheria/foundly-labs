import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphQLContext } from '../../graphql/context';
import { PlatformService } from './platform.service';

export const REQUIRED_SUPER_ADMIN_KEY = 'foundly:requiresSuperAdmin';

/**
 * Enforces the global platform role on platform-only operations (019). Distinct from the
 * module-license `PlanGuard` and the subscription `SubscriptionGuard`: this guard requires a
 * verified identity carrying the platform role (`super_admin`) or an allow-listed email.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly platformService: PlatformService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<boolean>(REQUIRED_SUPER_ADMIN_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;
    if (!required) {
      return true;
    }
    const user = GqlExecutionContext.create(context).getContext<GraphQLContext>().user;
    this.platformService.requireSuperAdmin(user);
    return true;
  }
}
