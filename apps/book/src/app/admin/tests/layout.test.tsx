import { describe, expect, it } from 'vitest';
import { requireTenant } from '../../../shared/auth/auth';

/**
 * Admin layout guard (FR-016 + feature 009 US2, feature 010 — live-only).
 * The layout is an async Server Component (not serially renderable in RTL); this
 * test verifies the guard decision it depends on:
 *  - no session ⇒ UNAUTHENTICATED (→ redirect `/login`)
 *  - live session bound to a tenant ⇒ ok with `tenantId`
 *  - session without a tenant ⇒ FORBIDDEN (→ redirect `/onboarding`)
 */
describe('admin layout guard (FR-016, 009-US2)', () => {
  it('fails UNAUTHENTICATED without a session (redirects to /login)', () => {
    const auth = requireTenant(null);
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.error.code).toBe('UNAUTHENTICATED');
  });

  it('resolves the tenant session from the live identity', () => {
    const auth = requireTenant({ userId: 'u-live', role: 'admin' as const, tenantId: 'ten-ana' });
    expect(auth.ok).toBe(true);
    if (auth.ok) expect(auth.data.tenantId).toBe('ten-ana');
  });

  it('fails FORBIDDEN for a session without a tenant (redirects to onboarding)', () => {
    const auth = requireTenant({ userId: 'u-x', role: 'professional' as const });
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.error.code).toBe('FORBIDDEN');
  });
});