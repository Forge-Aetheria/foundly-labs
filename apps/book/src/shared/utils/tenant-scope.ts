import { requireRole, requireTenant, type Session } from '../infra/auth';
import { getEffectiveSession } from '../infra/authServer';
import { ok, type ActionResult } from '../infra/result';

/**
 * Resolve the acting admin's tenant from the live session (feature 010 — the
 * identity provider is the only session source; no in-memory/local seam exists).
 * Server-request scope only (pulls `next/headers`): callers outside a request
 * scope (e.g. legacy client-store surfaces) resolve to UNAUTHENTICATED instead
 * of a fake session.
 */
export async function adminTenantId(): Promise<ActionResult<string>> {
  let session: Session | null;
  try {
    session = await getEffectiveSession();
  } catch {
    // Server-only session helpers cannot run outside a request scope; treat as
    // unauthenticated — never fall back to a local/mock session (FR-010).
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