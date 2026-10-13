import { beforeEach, describe, expect, it } from 'vitest';
import { resetStore } from '../../shared/infra/store';
import { requireTenant } from '../../shared/infra/auth';
import { resolveLocalSession } from '../../shared/infra/session';

/**
 * Admin layout guard (FR-016 + feature 009 US2).
 * The layout is an async Server Component (not serially renderable in RTL); this
 * test verifies the guard decision it depends on:
 *  - no session ⇒ UNAUTHENTICATED (→ redirect `/login`)
 *  - local session bound to a tenant ⇒ ok with `tenantId`
 *  - session without a tenant ⇒ FORBIDDEN (→ redirect `/onboarding`)
 */
describe('admin layout guard (FR-016, 009-US2)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('fails UNAUTHENTICATED without a session (redirects to /login)', () => {
    const auth = requireTenant(null);
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.error.code).toBe('UNAUTHENTICATED');
  });

  it('resolves the tenant session from the local seam', () => {
    const auth = requireTenant(resolveLocalSession('u-owner-ana'));
    expect(auth.ok).toBe(true);
    if (auth.ok) expect(auth.data.tenantId).toBe('ten-ana');
  });

  it('fails UNAUTHENTICATED for an unknown local user', () => {
    const auth = requireTenant(resolveLocalSession('missing-user'));
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.error.code).toBe('UNAUTHENTICATED');
  });

  it('fails FORBIDDEN for a session without a tenant (redirects to onboarding)', () => {
    const auth = requireTenant({ userId: 'u-x', role: 'professional' });
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.error.code).toBe('FORBIDDEN');
  });
});
