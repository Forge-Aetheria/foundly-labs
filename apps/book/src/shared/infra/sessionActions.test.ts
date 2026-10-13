import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieStore, redirectMock } = vi.hoisted(() => ({
  cookieStore: new Map<string, string>(),
  redirectMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { name, value: cookieStore.get(name) } : undefined,
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

import { signIn, signOut } from './sessionActions';
import { resetStore } from './store';
import { LOCAL_SESSION_COOKIE } from './authConstants';

describe('session actions (009 — US1/US3, local mode)', () => {
  beforeEach(() => {
    resetStore();
    cookieStore.clear();
    redirectMock.mockClear();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  });

  it('signs in a seeded owner and sets the session cookie', async () => {
    const result = await signIn({ email: 'ana@foundly.dev', password: 'mock-credential' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.redirectTo).toBe('/admin/agenda');
    expect(cookieStore.get(LOCAL_SESSION_COOKIE)).toBe('u-owner-ana');
  });

  it('rejects invalid credentials without creating a session', async () => {
    const result = await signIn({ email: 'ana@foundly.dev', password: 'wrong-password' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
    expect(cookieStore.has(LOCAL_SESSION_COOKIE)).toBe(false);
  });

  it('rejects malformed input with a validation error', async () => {
    const result = await signIn({ email: 'not-an-email', password: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('signs out, clearing the cookie and redirecting to /login', async () => {
    cookieStore.set(LOCAL_SESSION_COOKIE, 'u-owner-ana');
    await expect(signOut()).rejects.toThrow('REDIRECT:/login');
    expect(cookieStore.has(LOCAL_SESSION_COOKIE)).toBe(false);
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
