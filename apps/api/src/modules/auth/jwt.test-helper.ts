import { webcrypto } from 'node:crypto';
import { createLocalJWKSet, exportJWK, SignJWT } from 'jose';
import type { LocalJWKSet } from 'jose';

export const TEST_AUTH_URL = 'https://test.supabase.co/auth/v1';
export const TEST_KID = 'test-kid';

export type TestJwk = Record<string, unknown>;

/** Ephemeral EC (P-256) key pair for offline specs — mirrors Supabase's ES256 signing key. */
export async function makeTestKeys(): Promise<{ publicJwk: TestJwk; privateJwk: TestJwk }> {
  const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  );
  return {
    publicJwk: { ...(await exportJWK(publicKey)), kid: TEST_KID, alg: 'ES256', use: 'sig' },
    privateJwk: await exportJWK(privateKey),
  };
}

/** Local JWKS mirroring the production remote key set (injected via the JWT_JWKS seam). */
export function makeLocalJwks(publicJwk: TestJwk): LocalJWKSet {
  return createLocalJWKSet({ keys: [publicJwk] });
}

export interface TokenOverrides {
  sub?: string;
  email?: string;
  role?: string;
  issuer?: string;
  audience?: string;
  expiresIn?: string;
  algorithm?: string;
  tenantId?: string;
  platformRole?: string;
}

/** ES256 test token signed against `privateJwk` with configurable claims (expiry, issuer, aud...). */
export async function signTestToken(
  privateJwk: TestJwk,
  overrides: TokenOverrides = {},
): Promise<string> {
  const {
    sub,
    email,
    role,
    issuer = TEST_AUTH_URL,
    audience = 'authenticated',
    expiresIn = '1h',
    algorithm = 'ES256',
    tenantId,
    platformRole,
  } = overrides;

  const claims: Record<string, unknown> = {};
  if (email !== undefined) claims.email = email;
  if (role !== undefined) claims.role = role;
  if (tenantId !== undefined || platformRole !== undefined) {
    const appMetadata: Record<string, unknown> = {};
    if (tenantId !== undefined) appMetadata.tenant_id = tenantId;
    if (platformRole !== undefined) appMetadata.platform_role = platformRole;
    claims.app_metadata = appMetadata;
  }

  const builder = new SignJWT(claims)
    .setProtectedHeader({ alg: algorithm, kid: TEST_KID })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expiresIn);
  if (sub) builder.setSubject(sub);

  return builder.sign(privateJwk);
}