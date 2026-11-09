import { beforeEach, describe, expect, it, vi } from 'vitest';

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    auth: { getUser: vi.fn(), signInWithPassword: vi.fn(), updateUser: vi.fn() },
  },
}));

vi.mock('../../../shared/auth/supabase', () => ({
  createBrowserSupabaseClient: vi.fn(() => supabaseMock),
}));

import { changePassword } from '../services';

function validInput(newPassword = 'nueva1234') {
  return { currentPassword: 'mock-credential', newPassword, confirmPassword: newPassword };
}

describe('security services (feature 024 — live-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { email: 'ana@foundly.dev' } },
      error: null,
    });
    supabaseMock.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    supabaseMock.auth.updateUser.mockResolvedValue({ data: {}, error: null });
  });

  it('rejects an incorrect current password without changing it', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    const result = await changePassword(validInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
    expect(supabaseMock.auth.updateUser).not.toHaveBeenCalled();
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
    const result = await changePassword(validInput('abcdefgh'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('updates the password on a valid change', async () => {
    const result = await changePassword(validInput());
    expect(result.ok).toBe(true);
    expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({ password: 'nueva1234' });
  });

  it('rejects when there is no authenticated user', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await changePassword(validInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });
});
