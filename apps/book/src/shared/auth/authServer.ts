import { createServerSupabaseClient } from './supabase/server';
import type { Session } from './auth';
import { requireTenant } from './auth';
import type { ActionResult } from '../types/result';
import { AUTH_CALL_TIMEOUT_MS, withTimeout } from './withTimeout';

/**
 * Server-only session helpers (feature 008 — session-auth.contract.md, feature
 * 010 — server/DB-only).
 * Importing this module pulls `next/headers`; only import from Server
 * Components, Server Actions, Route Handlers or server-side query modules.
 * Since feature 010, the identity provider is the ONLY session source: the
 * local cookie seam has been removed and nothing in-memory can authenticate.
 */

/**
 * Live Supabase session built from VERIFIED claims (`getClaims`, not the
 * unvalidated session user):
 * - `userId` = `sub`
 * - `tenantId` = `app_metadata.tenant_id` (fallback top-level `tenant_id`)
 * - `role` = `'admin'` when tenant-bound, else `'professional'`
 */
export async function getLiveSession(): Promise<Session | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await withTimeout(supabase.auth.getClaims(), AUTH_CALL_TIMEOUT_MS, {
    data: null,
    error: null,
  });
  // `getClaims()` returns `{ data: { claims, header, signature } }` — the JWT
  // payload lives at `data.claims`, not `data` (feature 009 fix).
  const claims = (data?.claims ?? null) as Record<string, unknown> | null;
  if (!claims || typeof claims.sub !== 'string' || claims.sub.length === 0) {
    return null;
  }
  const appMetadata =
    claims.app_metadata !== null && typeof claims.app_metadata === 'object'
      ? (claims.app_metadata as Record<string, unknown>)
      : {};
  const rawTenant: unknown = appMetadata.tenant_id ?? claims.tenant_id;
  const tenantId = typeof rawTenant === 'string' && rawTenant ? rawTenant : undefined;
  return {
    userId: claims.sub,
    role: tenantId ? 'admin' : 'professional',
    tenantId,
  };
}

/**
 * Effective session for server guards (feature 009 — US2, feature 010).
 * Live Supabase claims ONLY — there is no local fallback: a session exists only
 * when the identity provider authenticates it.
 */
export async function getEffectiveSession(): Promise<Session | null> {
  return getLiveSession();
}

/** Access token for GraphQL bearer injection (server-side only). */
export async function getAccessToken(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await withTimeout(supabase.auth.getSession(), AUTH_CALL_TIMEOUT_MS, {
    data: { session: null },
    error: null,
  });
  return data.session?.access_token ?? null;
}

/** Admin-guard decision (US2): tenant-bound session or a typed failure. */
export async function resolveTenantSession(): Promise<ActionResult<Session>> {
  return requireTenant(await getEffectiveSession());
}