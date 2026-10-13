import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sessionMock, supabaseMock } = vi.hoisted(() => ({
  sessionMock: { getEffectiveSession: vi.fn() },
  supabaseMock: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

vi.mock('./authServer', () => ({
  getEffectiveSession: (...args: unknown[]) => sessionMock.getEffectiveSession(...args),
}));

vi.mock('./supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => supabaseMock),
}));

import { changePassword } from './securityActions';

function validInput(newPassword = 'nueva1234') {
  return { currentPassword: 'mock-credential', newPassword, confirmPassword: newPassword };
}

describe('changePassword (009 — US5, live-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.getEffectiveSession.mockResolvedValue({
      userId: 'u-live',
      role: 'admin',
      tenantId: 'ten-live',
    });
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
    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@foundly.dev',
      password: 'mock-credential',
    });
    expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({ password: 'nueva1234' });
  });

  it('rejects when there is no session', async () => {
    sessionMock.getEffectiveSession.mockResolvedValue(null);
    const result = await changePassword(validInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });
});