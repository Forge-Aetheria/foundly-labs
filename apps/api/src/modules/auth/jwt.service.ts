import { Inject, Injectable } from '@nestjs/common';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { LocalJWKSet, RemoteJWKSet } from 'jose';
import { GraphQLError } from 'graphql';
import type { AuthUser } from './jwt.types';

const CLOCK_TOLERANCE_SECONDS = 30;
const AUDIENCE = 'authenticated';

/**
 * Asymmetric algorithms accepted for Supabase Auth access tokens. New Supabase
 * projects sign with an asymmetric ECC signing key (`ES256`); legacy asymmetric
 * setups use `RS256`. Hard-coding a single algorithm (`['RS256']`) rejected
 * every ES256 token, failing all authenticated requests with `UNAUTHENTICATED`.
 */
const ALLOWED_ALGORITHMS: string[] = ['RS256', 'ES256'];

/** JWKS provider seam (Nest token) — one injectable RemoteJWKSet for the whole app. */
export const JWT_JWKS = Symbol('JWT_JWKS');

export type JwksResolver = RemoteJWKSet | LocalJWKSet;

/** Supabase Auth base URL (issuer) read from the environment; fail-fast when absent. */
export function supabaseAuthUrl(): string {
  const url = process.env.SUPABASE_AUTH_URL;
  if (!url) {
    throw new Error('SUPABASE_AUTH_URL is not set');
  }
  return url.replace(/\/+$/, '');
}

/** Production JWKS provider: cached remote key set for `.well-known/jwks.json`. */
export function createProductionJwks(): RemoteJWKSet {
  if (!process.env.SUPABASE_AUTH_URL) {
    // Lazy fail: missing URL must not break module boot (existing specs compile AppModule
    // without it); it fails closed with a clear config error at first verification.
    return (async () => {
      throw new Error('SUPABASE_AUTH_URL is not set');
    }) as unknown as RemoteJWKSet;
  }
  return createRemoteJWKSet(new URL(`${supabaseAuthUrl()}/.well-known/jwks.json`));
}

function unauthError(): GraphQLError {
  return new GraphQLError('Unauthenticated', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

/**
 * Verifies Supabase Auth access tokens (asymmetric, signed by the project JWKS:
 * `ES256` in new projects, `RS256` in legacy asymmetric setups) and resolves the
 * caller identity (`AuthUser`). Any verification failure fails closed as `UNAUTHENTICATED`.
 */
@Injectable()
export class SupabaseJwtService {
  constructor(
    @Inject(JWT_JWKS) private readonly jwks: JwksResolver,
  ) {}

  async verify(raw: string): Promise<AuthUser> {
    const issuer = supabaseAuthUrl();

    let payload: Record<string, unknown>;
    try {
      const { payload: claims } = await jwtVerify(raw, this.jwks, {
        algorithms: ALLOWED_ALGORITHMS,
        issuer,
        audience: AUDIENCE,
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });
      payload = claims;
    } catch {
      throw unauthError();
    }

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw unauthError();
    }

    const aud = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
    const appMetadata =
      typeof payload.app_metadata === 'object' && payload.app_metadata !== null
        ? (payload.app_metadata as Record<string, unknown>)
        : {};
    const tenantId =
      typeof appMetadata.tenant_id === 'string'
        ? appMetadata.tenant_id
        : typeof payload.tenant_id === 'string'
          ? payload.tenant_id
          : undefined;
    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      role: typeof payload.role === 'string' ? payload.role : AUDIENCE,
      aud: typeof aud === 'string' ? aud : AUDIENCE,
      exp: typeof payload.exp === 'number' ? payload.exp : 0,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      tenantId,
    };
  }
}