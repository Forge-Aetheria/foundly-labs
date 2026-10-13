/**
 * Edge-safe auth constants (feature 009 — specs/book/009-admin-auth).
 * No framework imports: safe to use from the Edge middleware and the Node server.
 * Feature 010: the local session cookie is gone — auth is provider-only.
 */

/** Sign-in route (public auth page). */
export const LOGIN_ROUTE = '/login';

/** Default landing route after a successful sign-in. */
export const POST_LOGIN_ROUTE = '/admin/agenda';

/** Registration entry point for accounts without a business binding. */
export const REGISTRATION_ROUTE = '/onboarding';

/**
 * Internal handler that clears the local session cookie and bounces the owner
 * back to `/login` when the API rejects the session (feature 012). Used as the
 * global target for `UNAUTHENTICATED` from the API.
 */
export const SESSION_EXPIRED_ROUTE = '/auth/session-expired';

/** Login query flag set by the session-expiry handler so the form can explain the bounce. */
export const SESSION_EXPIRED_REASON = 'session-expired';
