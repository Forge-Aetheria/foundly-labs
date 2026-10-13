import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock, tokenMock, redirectMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  tokenMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock('../client', () => ({ apiRequest: (...args: unknown[]) => apiMock(...args) }));
vi.mock('../../auth/authServer', () => ({
  getAccessToken: (...args: unknown[]) => tokenMock(...args),
}));

import { apiRequestAdmin } from '../admin-request';
import { MyServicesDocument } from '../generated';

describe('apiRequestAdmin (feature 012 — session-aware transport)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenMock.mockResolvedValue('tok');
  });

  it('injects the bearer token and returns the result', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { myServices: [] } });
    const result = await apiRequestAdmin(MyServicesDocument, { active: null });
    expect(apiMock).toHaveBeenCalledWith(MyServicesDocument, { active: null }, { token: 'tok' });
    expect(result.ok).toBe(true);
  });

  it('treats a missing token as a session problem (global redirect)', async () => {
    tokenMock.mockResolvedValue(null);
    await expect(apiRequestAdmin(MyServicesDocument, { active: null })).rejects.toThrow(
      'REDIRECT:/auth/session-expired',
    );
    expect(redirectMock).toHaveBeenCalledWith('/auth/session-expired');
  });

  it('redirects globally on API UNAUTHENTICATED instead of returning inline text', async () => {
    apiMock.mockResolvedValue({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'x' } });
    await expect(apiRequestAdmin(MyServicesDocument, { active: null })).rejects.toThrow(
      'REDIRECT:/auth/session-expired',
    );
  });

  it('returns transient errors to the caller (no redirect)', async () => {
    apiMock.mockResolvedValue({ ok: false, error: { code: 'STATE_ERROR', message: 'down' } });
    const result = await apiRequestAdmin(MyServicesDocument, { active: null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('STATE_ERROR');
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
