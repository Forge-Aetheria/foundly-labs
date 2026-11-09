import { Global, Module } from '@nestjs/common';
import { JwtResolver } from './jwt.resolver';
import { SupabaseJwtGuard } from './jwt.guard';
import { createProductionJwks, JWT_JWKS, SupabaseJwtService } from './jwt.service';
import { TenantStatusCache } from './tenant-status.cache';
import { TenantStatusGuard } from './tenant-status.guard';

@Global()
@Module({
  providers: [
    SupabaseJwtGuard,
    TenantStatusGuard,
    TenantStatusCache,
    JwtResolver,
    { provide: JWT_JWKS, useFactory: createProductionJwks },
    SupabaseJwtService,
  ],
  exports: [
    SupabaseJwtGuard,
    TenantStatusGuard,
    TenantStatusCache,
    JWT_JWKS,
    SupabaseJwtService,
  ],
})
export class AuthModule {}
