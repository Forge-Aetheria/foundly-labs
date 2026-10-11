import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { AuthContext } from './auth.context';
import { AuthService } from './auth.service';

export const REQUIRED_PLANS_KEY = 'foundly:requiredPlans';

export interface AuthRequest {
  headers: { authorization?: string };
  authContext?: AuthContext;
}

export function getAuthRequest(context: ExecutionContext): AuthRequest {
  return GqlExecutionContext.create(context).getContext().req;
}

export function unauthError(): GraphQLError {
  return new GraphQLError('Unauthenticated', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

export function forbiddenError(message = 'Forbidden'): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'FORBIDDEN' },
  });
}

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = getAuthRequest(context);
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw unauthError();
    }
    const token = header.slice('Bearer '.length).trim();

    let identity;
    try {
      identity = this.authService.verifySession(token);
    } catch {
      throw unauthError();
    }

    const tenant = await this.prismaService.client.tenant.findUnique({
      where: { id: identity.tenantId },
      select: { id: true, status: true, plan: true },
    });
    if (!tenant || tenant.status !== 'active') {
      throw forbiddenError('Tenant is not active');
    }

    req.authContext = {
      userId: identity.userId,
      tenantId: identity.tenantId,
      role: identity.role,
      tenant: {
        id: tenant.id,
        status: tenant.status,
        plan: tenant.plan,
      },
    };
    return true;
  }
}

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PLANS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (required.length === 0) {
      return true;
    }
    const auth = getAuthRequest(context).authContext;
    if (!auth?.tenant || !required.includes(auth.tenant.plan ?? '')) {
      throw forbiddenError('Required plan is not active');
    }
    return true;
  }
}
