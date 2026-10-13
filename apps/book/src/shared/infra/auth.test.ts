import { describe, expect, it } from 'vitest';
import { requireRole, requireTenant } from './auth';

describe('auth seam (feature 008/010 — session-auth.contract.md, live-only)', () => {
  it('accepts a tenant-bound session', () => {
    const session = { userId: 'u-live-1', role: 'admin' as const, tenantId: 'ten-live-1' };

    const tenant = requireTenant(session);
    expect(tenant.ok).toBe(true);
    if (tenant.ok) expect(tenant.data.tenantId).toBe('ten-live-1');

    const withRole = requireRole(session, ['admin']);
    expect(withRole.ok).toBe(true);
  });

  it('rejects a missing session as UNAUTHENTICATED', () => {
    const tenant = requireTenant(null);
    expect(tenant.ok).toBe(false);
    if (!tenant.ok) expect(tenant.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a non-tenant-bound session as FORBIDDEN', () => {
    const result = requireTenant({ userId: 'u-x', role: 'professional' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
  });

  it('rejects an unallowed role as FORBIDDEN', () => {
    const result = requireRole({ userId: 'u-x', role: 'professional', tenantId: 'ten-1' }, ['admin']);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
  });
});