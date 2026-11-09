import { LOGIN_ROUTE, POST_LOGIN_ROUTE, REGISTRATION_ROUTE } from './authConstants';

/**
 * Client-safe session status and redirect decisions (feature 024).
 * Mirrors the old edge guard (`authGuard.ts`) but for SPA routing.
 */
export type SessionStatus = 'loading' | 'anonymous' | 'authenticated' | 'missing-tenant';

export function isAuthenticated(status: SessionStatus): boolean {
  return status === 'authenticated';
}

/** Redirect target for a protected route, or null when allowed. */
export function protectedRedirect(status: SessionStatus): string | null {
  if (status === 'loading') return null;
  if (status === 'anonymous') return LOGIN_ROUTE;
  if (status === 'missing-tenant') return REGISTRATION_ROUTE;
  return null;
}

/** Redirect target for the login route, or null when allowed (anonymous). */
export function guestRedirect(status: SessionStatus): string | null {
  if (status === 'loading') return null;
  if (status === 'authenticated' || status === 'missing-tenant') return POST_LOGIN_ROUTE;
  return null;
}

/** Tenant id derived from Supabase `app_metadata`/claims (session is the only scope). */
export function tenantFromMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null;
  const value = metadata.tenant_id;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export { LOGIN_ROUTE, POST_LOGIN_ROUTE, REGISTRATION_ROUTE };
