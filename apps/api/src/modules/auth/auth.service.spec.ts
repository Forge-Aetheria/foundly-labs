import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

const SECRET = 'test-secret';

describe('AuthService (unit, 006-foundly-pass-auth)', () => {
  let service: AuthService;

  beforeEach(() => {
    process.env.FOUNDLY_PASS_SECRET = SECRET;
    service = new AuthService();
  });

  it('signs and verifies a session round-trip', () => {
    const token = service.signSession({
      userId: 'u1',
      tenantId: 't1',
      role: 'owner',
    });
    expect(service.verifySession(token)).toEqual({
      userId: 'u1',
      tenantId: 't1',
      role: 'owner',
    });
  });

  it('rejects an expired session with UNAUTHENTICATED', () => {
    const token = service.signSession({ userId: 'u1', tenantId: 't1', role: 'owner' }, -1000);
    expect(() => service.verifySession(token)).toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
  });

  it('rejects a tampered payload', () => {
    const token = service.signSession({
      userId: 'u1',
      tenantId: 't1',
      role: 'owner',
    });
    const [payload, sig] = token.split('.');
    const tampered = (payload?.[0] === 'A' ? 'B' : 'A') + (payload?.slice(1) ?? '');
    expect(() => service.verifySession(`${tampered}.${sig}`)).toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
  });

  it('rejects a tampered signature', () => {
    const token = service.signSession({
      userId: 'u1',
      tenantId: 't1',
      role: 'owner',
    });
    const [payload, sig] = token.split('.');
    const tampered = (sig?.[0] === 'A' ? 'B' : 'A') + (sig?.slice(1) ?? '');
    expect(() => service.verifySession(`${payload}.${tampered}`)).toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
  });

  it('rejects malformed input', () => {
    expect(() => service.verifySession('')).toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
    expect(() => service.verifySession('not-a-token')).toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
    expect(() => service.verifySession('a.b.c')).toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
  });
});
