import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/jwt.guard';
import { REQUIRED_SUPER_ADMIN_KEY, SuperAdminGuard } from './platform.guard';

/**
 * Require the global platform role for a platform-only operation. Applies JWT verification first,
 * then the Super Admin check (which needs the verified `ctx.user`).
 */
export function RequireSuperAdmin(): MethodDecorator {
  return applyDecorators(
    SetMetadata(REQUIRED_SUPER_ADMIN_KEY, true),
    UseGuards(SupabaseJwtGuard, SuperAdminGuard),
  );
}
