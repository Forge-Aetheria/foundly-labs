import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieStore } = vi.hoisted(() => ({ cookieStore: new Map<string, string>() }));

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

import { changePassword } from './securityActions';
import { getStore, resetStore } from './store';
import { LOCAL_SESSION_COOKIE } from './authConstants';

describe('changePassword (009 — US5, local mode)', () => {
  beforeEach(() => {
    resetStore();
    cookieStore.clear();
    cookieStore.set(LOCAL_SESSION_COOKIE, 'u-owner-ana');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  });

  it('rejects an incorrect current password without changing it', async () => {
    const result = await changePassword({
      currentPassword: 'wrong',
      newPassword: 'nueva1234',
      confirmPassword: 'nueva1234',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
    expect(getStore().users.find((user) => user.id === 'u-owner-ana')?.credential).toBe(
      'mock-credential',
    );
  });

  it('rejects a mismatched confirmation with a validation error', async () => {
    const result = await changePassword({
      currentPassword: 'mock-credential',
      newPassword: 'nueva1234',
      confirmPassword: 'otra1234',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a weak new password', async () => {
    const result = await changePassword({
      currentPassword: 'mock-credential',
      newPassword: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('updates the credential on a valid change', async () => {
    const result = await changePassword({
      currentPassword: 'mock-credential',
      newPassword: 'nueva1234',
      confirmPassword: 'nueva1234',
    });
    expect(result.ok).toBe(true);
    expect(getStore().users.find((user) => user.id === 'u-owner-ana')?.credential).toBe('nueva1234');
  });

  it('rejects when there is no session', async () => {
    cookieStore.clear();
    const result = await changePassword({
      currentPassword: 'mock-credential',
      newPassword: 'nueva1234',
      confirmPassword: 'nueva1234',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });
});
