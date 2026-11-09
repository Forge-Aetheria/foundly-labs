import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  UseGuards,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphQLContext } from '../../graphql/context';
import type { AuthUser as AuthUserIdentity } from './jwt.types';
import { SupabaseJwtGuard } from './jwt.guard';
import { TenantStatusGuard } from './tenant-status.guard';

/**
 * Protect an operation with Supabase JWT verification and the tenant-status check.
 * Use `@AllowInactiveTenant()` for the few operations that must work while the
 * tenant is suspended or in draft.
 */
export function RequireAuth(): MethodDecorator {
  return applyDecorators(UseGuards(SupabaseJwtGuard, TenantStatusGuard));
}

/** Inject the verified `ctx.user` (AuthUser) into a resolver argument. */
export const AuthUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUserIdentity | undefined =>
    GqlExecutionContext.create(context).getContext<GraphQLContext>().user,
);
