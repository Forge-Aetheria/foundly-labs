import { beforeEach, describe, expect, it } from 'vitest';
import { SupabaseJwtService } from './jwt.service';
import {
  makeLocalJwks,
  makeTestKeys,
  signTestToken,
  TEST_AUTH_URL,
  type TestJwk,
} from './jwt.test-helper';
import type { JwksResolver } from './jwt.service';

const AUTH_URL = TEST_AUTH_URL;

describe('SupabaseJwtService (unit, 008-supabase-jwt-auth)', () => {
  let publicJwk: TestJwk;
  let privateJwk: TestJwk;
  let service: SupabaseJwtService;

  beforeEach(async () => {
    process.env.SUPABASE_AUTH_URL = AUTH_URL;
    ({ publicJwk, privateJwk } = await makeTestKeys());
    service = new SupabaseJwtService(makeLocalJwks(publicJwk));
  });

  function expectUnauth(promise: Promise<unknown>): Promise<void> {
    return expect(promise).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
  }

  it('resolves the AuthUser from a valid token (round-trip)', async () => {
    const token = await signTestToken(privateJwk, {
      sub: 'user-123',
      email: 'user@foundly.dev',
      role: 'authenticated',
    });
    await expect(service.verify(token)).resolves.toEqual({
      sub: 'user-123',
      email: 'user@foundly.dev',
      role: 'authenticated',
      aud: 'authenticated',
      exp: expect.any(Number) as unknown as number,
      iat: expect.any(Number) as unknown as number,
    });
  });

  it('accepts the ES256 (EC P-256) tokens Supabase signs in production', async () => {
    const token = await signTestToken(privateJwk, { sub: 'ec-user' });
    const [header] = token.split('.');
    const decoded = JSON.parse(Buffer.from(header ?? '', 'base64url').toString('utf8')) as {
      alg?: string;
    };
    // Regression guard: the test key MUST be EC/ES256, so the suite would fail
    // if the service reverted to an RS256-only allow-list.
    expect(decoded.alg).toBe('ES256');
    await expect(service.verify(token)).resolves.toMatchObject({ sub: 'ec-user' });
  });

  it('rejects an expired token (beyond the 30 s leeway)', async () => {
    const token = await signTestToken(privateJwk, { expiresIn: '-1h' });
    await expectUnauth(service.verify(token));
  });

  it('rejects a tampered token (bad signature)', async () => {
    const token = await signTestToken(privateJwk, { sub: 'u1' });
    const index = Math.floor(token.length / 2);
    const tampered = `${token.slice(0, index)}${token[index] === 'A' ? 'B' : 'A'}${token.slice(index + 1)}`;
    await expectUnauth(service.verify(tampered));
  });

  it('rejects a token with the wrong issuer', async () => {
    const token = await signTestToken(privateJwk, {
      sub: 'u1',
      issuer: 'https://evil.supabase.co/auth/v1',
    });
    await expectUnauth(service.verify(token));
  });

  it('rejects a token with the wrong audience', async () => {
    const token = await signTestToken(privateJwk, { sub: 'u1', audience: 'service_role' });
    await expectUnauth(service.verify(token));
  });

  it('rejects a token without a subject', async () => {
    const token = await signTestToken(privateJwk, { sub: '' });
    await expectUnauth(service.verify(token));
  });

  it('fails closed when the key cannot be resolved (unknown kid / provider failure)', async () => {
    const other = await makeTestKeys();
    const foreignToken = await signTestToken(other.privateJwk, { sub: 'u1' });
    await expectUnauth(service.verify(foreignToken));

    const throwing = (async () => {
      throw new Error('jwks unreachable');
    }) as unknown as JwksResolver;
    const brokenService = new SupabaseJwtService(throwing);
    await expectUnauth(brokenService.verify(foreignToken));
  });

  it('throws a config error when SUPABASE_AUTH_URL is missing', async () => {
    delete process.env.SUPABASE_AUTH_URL;
    const token = await signTestToken(privateJwk, { sub: 'u1' });
    await expect(service.verify(token)).rejects.toThrowError('SUPABASE_AUTH_URL is not set');
  });
});