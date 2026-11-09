import { requireRole, requireTenant, type Session } from '../auth/auth';
import { getCurrentSession } from '../auth/supabase';
import { ok, type ActionResult } from '../types/result';

/**
 * Resolve the acting admin's tenant from the live browser session (feature 024).
 * Client-safe replacement for the old server-only `tenant-scope`.
 */
export async function adminTenantId(): Promise<ActionResult<string>> {
  let session: Session | null;
  try {
    session = await getCurrentSession();
  } catch {
    session = null;
  }
  const role = requireRole(session, ['admin']);
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
