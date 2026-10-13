import type { ErrorCode } from './result';
import { getStore } from './store';
import { fail, type ActionResult } from './result';

/**
 * Client-safe session primitives (feature 008).
 * Importing this file never pulls `next/headers` into the browser bundle.
 * Live Supabase sessions live in `./authServer` (server-only).
 */

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
 * Active session from the in-memory seam — CLIENT-STORE MUTATIONS ONLY.
 * Used by store-bound surfaces (gallery/profile/staff client actions) to scope
 * their demo data. Server route guards MUST use `getEffectiveSession()` from
 * `./authServer` (live session ?? local cookie); this producer never authenticates
 * a request (feature 009 — US2).
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