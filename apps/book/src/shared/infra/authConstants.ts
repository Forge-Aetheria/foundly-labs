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
