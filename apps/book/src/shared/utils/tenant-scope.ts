import { getCurrentSession, requireRole, requireTenant } from '../infra/auth';
import { ok, type ActionResult } from '../infra/result';

/** Resolve the acting admin's tenant from the Foundly Pass session seam. */
export function adminTenantId(): ActionResult<string> {
  const role = requireRole(getCurrentSession(), ['admin']);
  if (!role.ok) return role;
  const tenant = requireTenant(role.data);
  if (!tenant.ok) return tenant;
  return ok(role.data.tenantId as string);
}

/** Trim to null: empty strings normalize to null across storefront writes. */
export function clean(value: string | null | undefined): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed ? trimmed : null;
}
