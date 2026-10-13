import { describe, expect, it } from 'vitest';
import { evaluateRedirect, isAdminPath, isLoginPath } from '../authGuard';

describe('authGuard (009 — US2)', () => {
  it('detects admin paths', () => {
    expect(isAdminPath('/admin')).toBe(true);
    expect(isAdminPath('/admin/agenda')).toBe(true);
    expect(isAdminPath('/adminX')).toBe(false);
    expect(isAdminPath('/onboarding')).toBe(false);
  });

  it('detects the login path only', () => {
    expect(isLoginPath('/login')).toBe(true);
    expect(isLoginPath('/login/extra')).toBe(false);
  });

  it('redirects unauthenticated admin requests to /login', () => {
    expect(evaluateRedirect('/admin/agenda', false)).toBe('/login');
    expect(evaluateRedirect('/admin/agenda', true)).toBeNull();
  });

  it('redirects authenticated login requests to the panel', () => {
    expect(evaluateRedirect('/login', true)).toBe('/admin/agenda');
    expect(evaluateRedirect('/login', false)).toBeNull();
  });

  it('leaves public routes untouched', () => {
    expect(evaluateRedirect('/', false)).toBeNull();
    expect(evaluateRedirect('/onboarding', false)).toBeNull();
  });
});
