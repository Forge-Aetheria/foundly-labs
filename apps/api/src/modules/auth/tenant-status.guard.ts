import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphQLContext } from '../../graphql/context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { forbiddenError } from './auth.errors';
import { TenantStatusCache } from './tenant-status.cache';
import { ALLOW_INACTIVE_TENANT_KEY } from './tenant-status.decorators';

/**
 * Enforces that the authenticated identity's tenant is operable (`active`) before
 * a protected resolver runs. Runs after `SupabaseJwtGuard`, so `ctx.user` is set.
 * Identities without a tenant (platform/support) are left to the operation.
 */
@Injectable()
export class TenantStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly cache: TenantStatusCache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_INACTIVE_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowed) return true;

    const user = GqlExecutionContext.create(context).getContext<GraphQLContext>().user;
    const tenantId = user?.tenantId;
    if (!tenantId) return true;

    let status = this.cache.get(tenantId);
    if (status === null) {
      const tenant = await this.prisma.client.tenant.findUnique({
        where: { id: tenantId },
        select: { status: true },
      });
      if (!tenant) {
        throw forbiddenError('Tenant is not active');
      }
      status = tenant.status;
      this.cache.set(tenantId, status);
    }

    if (status !== 'active') {
      throw forbiddenError('Tenant is not active');
    }
    return true;
  }
}
