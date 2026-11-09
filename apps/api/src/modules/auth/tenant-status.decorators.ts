import { SetMetadata } from '@nestjs/common';

export const ALLOW_INACTIVE_TENANT_KEY = 'foundly:allowInactiveTenant';

/**
 * Opt an operation out of the tenant-status guard. Reserved for identity checks,
 * subscription management and platform operations that must work while a tenant
 * is suspended or in draft.
 */
export function AllowInactiveTenant(): MethodDecorator {
  return SetMetadata(ALLOW_INACTIVE_TENANT_KEY, true);
}
