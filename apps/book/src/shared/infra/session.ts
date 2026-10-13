import { cookies } from 'next/headers';
import type { Session } from './auth';
import { getStore } from './store';
import { LOCAL_SESSION_COOKIE } from './authConstants';

/**
 * Local session seam (feature 009 — specs/book/009-admin-auth).
 * Server-only (pulls `next/headers`). Used only when no live Supabase provider is
 * configured; the cookie stores a `userId` that is re-resolved against the store
 * on every read (the cookie is never trusted as the source of truth).
 */

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Pure resolver: `userId` → active store user → `Session`. */
export function resolveLocalSession(userId: string | undefined): Session | null {
  if (!userId) return null;
  const user = getStore().users.find((item) => item.id === userId);
  if (!user || user.status !== 'active') return null;
  return {
    userId: user.id,
    role: user.role === 'owner' ? 'admin' : 'professional',
    tenantId: user.tenantId,
  };
}

/** Read the local session from the request cookie, if any. */
export async function readLocalSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  return resolveLocalSession(cookieStore.get(LOCAL_SESSION_COOKIE)?.value);
}

/** Persist the local session (Server Actions / Route Handlers only). */
export async function writeLocalSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProduction(),
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/** Clear the local session (Server Actions / Route Handlers only). */
export async function clearLocalSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_SESSION_COOKIE);
}
