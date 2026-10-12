import { Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserParam, RequireAuth } from './jwt.decorators';
import type { AuthUser } from './jwt.types';
import { ViewerObject } from './jwt.types';

/** Sample protected surface proving the Supabase JWT identity layer (opt-in). */
@Resolver()
export class JwtResolver {
  @Query(() => ViewerObject)
  @RequireAuth()
  viewer(@AuthUserParam() user: AuthUser): ViewerObject {
    return {
      sub: user.sub,
      email: user.email ?? null,
      role: user.role,
      aud: user.aud,
    };
  }
}