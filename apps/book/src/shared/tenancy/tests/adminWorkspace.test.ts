import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminWorkspace } from '../adminWorkspace';

const { tenantMock, identityMock } = vi.hoisted(() => ({
  tenantMock: vi.fn(),
  identityMock: vi.fn(),
}));

vi.mock('../queries', () => ({
  getCurrentTenant: (...args: unknown[]) => tenantMock(...args),
}));

vi.mock('../../auth/supabase', () => ({
  getAuthIdentity: (...args: unknown[]) => identityMock(...args),
}));

const session = { userId: 'u1', role: 'admin' as const, tenantId: 't1' };

describe('fetchAdminWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    identityMock.mockResolvedValue({ userId: 'u1', email: 'a@foundly.dev', fullName: 'Ana', avatarUrl: null });
  });

  it('builds the workspace from the server-resolved business', async () => {
    tenantMock.mockResolvedValue({
      ok: true,
      data: { name: 'Estudio Ana', slug: 'estudio-ana', isPublic: true, avatar: null },
    });

    const result = await fetchAdminWorkspace(session);
    expect(tenantMock).toHaveBeenCalledWith();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.tenantId).toBe('t1');
      expect(result.data.tenantName).toBe('Estudio Ana');
      expect(result.data.publicHref).toBe('/estudio-ana');
    }
  });

  it('rejects a session without a bound business before calling the API', async () => {
    const result = await fetchAdminWorkspace({ userId: 'u1', role: 'admin' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
    expect(tenantMock).not.toHaveBeenCalled();
  });

  it('localizes a forbidden workspace without leaking API text', async () => {
    tenantMock.mockResolvedValue({
      ok: false,
      error: { code: 'FORBIDDEN', message: 'Tenant is not active' },
    });

    const result = await fetchAdminWorkspace(session);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
      expect(result.error.message).not.toBe('Tenant is not active');
      expect(result.error.message).toMatch(/permisos/i);
    }
  });

  it('keeps UNAUTHENTICATED for the global session handler', async () => {
    tenantMock.mockResolvedValue({
      ok: false,
      error: { code: 'UNAUTHENTICATED', message: 'Unauthenticated' },
    });

    const result = await fetchAdminWorkspace(session);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });
});
