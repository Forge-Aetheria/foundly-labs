import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphQLContext } from '../../graphql/context';
import { unauthError } from './auth.guards';
import { SupabaseJwtService } from './jwt.service';

interface RequestLike {
  headers?: { authorization?: string };
}

type GuardContext = GraphQLContext & { req?: RequestLike };

/**
 * Opt-in guard for Supabase Auth access tokens. Verifies the bearer credential and attaches the
 * resolved `user` to the GraphQL request context. Fails closed as `UNAUTHENTICATED`.
 */
@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(private readonly jwtService: SupabaseJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context).getContext<GuardContext>();
    const header = gqlContext.req?.headers?.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw unauthError();
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw unauthError();
    }
    gqlContext.user = await this.jwtService.verify(token);
    return true;
  }
}