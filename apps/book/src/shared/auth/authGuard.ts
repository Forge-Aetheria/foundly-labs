import { LOGIN_ROUTE, POST_LOGIN_ROUTE } from './authConstants';

/**
 * Edge-safe route guard helpers (feature 009 — specs/book/009-admin-auth).
 * Imported by `src/middleware.ts`; MUST NOT import the in-memory store or
 * `next/headers` (Edge runtime isolation). The server guards re-validate.
 */

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isLoginPath(pathname: string): boolean {
  return pathname === LOGIN_ROUTE;
}

/**
 * Redirect decision for a request path given whether a session is present.
 * Returns the target path, or `null` when no redirect is required.
 */
export function evaluateRedirect(pathname: string, authenticated: boolean): string | null {
  if (isAdminPath(pathname) && !authenticated) return LOGIN_ROUTE;
  if (isLoginPath(pathname) && authenticated) return POST_LOGIN_ROUTE;
  return null;
}
