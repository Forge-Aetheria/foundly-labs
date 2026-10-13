import { createServerSupabaseClient } from './supabase/server';
import type { Session } from './auth';
import { requireTenant } from './auth';
import { readLocalSession } from './session';
import type { ActionResult } from './result';

/**
 * Server-only session helpers (feature 008 — session-auth.contract.md).
 * Importing this module pulls `next/headers`; only import from Server
 * Components, Server Actions, Route Handlers or server-side query modules.
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
  const { data } = await supabase.auth.getClaims();
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
 * Effective session for server guards (feature 009 — US2).
 * Live Supabase session first, then the local cookie seam. The in-memory
 * `store.sessions` is intentionally NOT consulted here: a user is unauthenticated
 * until they sign in.
 */
export async function getEffectiveSession(): Promise<Session | null> {
  const live = await getLiveSession();
  if (live) return live;
  return readLocalSession();
}

/** Access token for GraphQL bearer injection (server-side only). */
export async function getAccessToken(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Admin-guard decision (US2): tenant-bound session or a typed failure. */
export async function resolveTenantSession(): Promise<ActionResult<Session>> {
  return requireTenant(await getEffectiveSession());
}