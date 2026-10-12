import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GqlAuthGuard, PlanGuard } from './auth.guards';
import { AuthResolver } from './auth.resolver';
import { JwtResolver } from './jwt.resolver';
import { SupabaseJwtGuard } from './jwt.guard';
import { createProductionJwks, JWT_JWKS, SupabaseJwtService } from './jwt.service';

@Global()
@Module({
  providers: [
    AuthService,
    GqlAuthGuard,
    PlanGuard,
    AuthResolver,
    SupabaseJwtGuard,
    JwtResolver,
    { provide: JWT_JWKS, useFactory: createProductionJwks },
    SupabaseJwtService,
  ],
  exports: [
    AuthService,
    GqlAuthGuard,
    PlanGuard,
    SupabaseJwtGuard,
    JWT_JWKS,
    SupabaseJwtService,
  ],
})
export class AuthModule {}