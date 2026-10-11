import type { ErrorCode } from './result';
import { getStore } from './store';
import { fail, type ActionResult } from './result';

export type Role = 'admin' | 'professional';

export interface Session {
  userId: string;
  role: Role;
  /** For professionals: the resource they are bound to. */
  resourceId?: string;
  /** For tenancy: the business the session belongs to (Foundly Pass seam). */
  tenantId?: string;
}

/** Require one of the allowed roles; mirrors the Foundly Pass session contract. */
export function requireRole(session: Session | null, allowed: Role[]): ActionResult<Session> {
  if (!session) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de Foundly Pass.');
  }
  if (!allowed.includes(session.role)) {
    return fail('FORBIDDEN', 'No tienes permisos para esta operación.');
  }
  return { ok: true, data: session };
}

/**
 * Require a tenancy-bound session (contracts/routes.contract.md).
 * The tenant context MUST come from the session, never from the URL.
 */
export function requireTenant(session: Session | null): ActionResult<Session> {
  if (!session) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de Foundly Pass.');
  }
  if (!session.tenantId) {
    return fail('FORBIDDEN', 'La sesión no está asociada a un negocio.');
  }
  return { ok: true, data: session };
}

/**
 * Active session for the current request (mock seam).
 * Resolves from the store's `sessions` collection; when Foundly Pass SSO ships,
 * only this function changes.
 */
export function getCurrentSession(): Session | null {
  const session = getStore().sessions[0];
  return session ?? null;
}

export function isActionError(value: unknown): value is { ok: false; error: { code: ErrorCode } } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    (value as { ok: unknown }).ok === false
  );
}
