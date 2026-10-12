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

/** Protect an operation with Supabase JWT verification (opt-in; 006 guards untouched). */
export function RequireAuth(): MethodDecorator {
  return applyDecorators(UseGuards(SupabaseJwtGuard));
}

/** Inject the verified `ctx.user` (AuthUser) into a resolver argument. */
export const AuthUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUserIdentity | undefined =>
    GqlExecutionContext.create(context).getContext<GraphQLContext>().user,
);