/**
 * Edge-safe auth constants (feature 009 — specs/book/009-admin-auth).
 * No framework imports: safe to use from the Edge middleware and the Node server.
 */

/** httpOnly cookie carrying the local (non-live) session's `userId`. */
export const LOCAL_SESSION_COOKIE = 'foundly_book_session';

/** Sign-in route (public auth page). */
export const LOGIN_ROUTE = '/login';

/** Default landing route after a successful sign-in. */
export const POST_LOGIN_ROUTE = '/admin/agenda';

/** Registration entry point for accounts without a business binding. */
export const REGISTRATION_ROUTE = '/onboarding';
