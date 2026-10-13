import { beforeEach, describe, expect, it, vi } from 'vitest';

const { supabaseMock, redirectMock } = vi.hoisted(() => ({
  supabaseMock: { auth: { signInWithPassword: vi.fn(), signOut: vi.fn() } },
  redirectMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock('../../../shared/auth/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => supabaseMock),
}));

import { signIn, signOut } from '../actions';
import { createServerSupabaseClient } from '../../../shared/auth/supabase/server';

describe('auth actions (feature 011 — live-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u-live' } },
      error: null,
    });
    supabaseMock.auth.signOut.mockResolvedValue({ error: null });
  });

  it('signs in through the identity provider', async () => {
    const result = await signIn({ email: 'ana@foundly.dev', password: 'secreto123' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.redirectTo).toBe('/admin/agenda');
    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@foundly.dev',
      password: 'secreto123',
    });
  });

  it('rejects invalid credentials', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    const result = await signIn({ email: 'ana@foundly.dev', password: 'wrong' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects malformed input with a validation error', async () => {
    const result = await signIn({ email: 'not-an-email', password: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('fails visibly when auth is not configured', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValueOnce(null);
    const result = await signIn({ email: 'ana@foundly.dev', password: 'secreto123' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('STATE_ERROR');
  });

  it('signs out and redirects to /login', async () => {
    await expect(signOut()).rejects.toThrow('REDIRECT:/login');
    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});