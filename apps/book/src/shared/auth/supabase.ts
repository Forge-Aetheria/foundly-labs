import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, hasSupabaseEnv } from '../../env';
import type { Session } from './auth';

export interface AuthIdentity {
  userId: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Browser Supabase client (feature 024 — SPA session).
 * Persists the session in `localStorage` and refreshes it automatically, mirroring
 * the validated behavior of `@foundly/mobile`. Never used for privileged actions.
 */

let client: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseEnv()) {
    return null;
  }
  client ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

/** Current validated session mapped to the local `Session` shape (or null). */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;
  const metadata = (session.user.app_metadata ?? {}) as Record<string, unknown>;
  const raw = metadata.tenant_id;
  const tenantId = typeof raw === 'string' && raw ? raw : undefined;
  return {
    userId: session.user.id,
    role: tenantId ? 'admin' : 'professional',
    ...(tenantId ? { tenantId } : {}),
  };
}

/** Current access token for authenticated GraphQL calls (or null). */
export async function getAccessToken(): Promise<string | null> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Verified user details used by the admin shell (name, email, avatar). */
export async function getAuthIdentity(): Promise<AuthIdentity | null> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const metadata =
    user.user_metadata !== null && typeof user.user_metadata === 'object'
      ? (user.user_metadata as Record<string, unknown>)
      : {};
  const email = typeof user.email === 'string' ? user.email : null;
  const fullName =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    (email ? (email.split('@')[0] ?? 'Administrador') : 'Administrador');
  const avatarUrl =
    (typeof metadata.avatar_url === 'string' && metadata.avatar_url) ||
    (typeof metadata.picture === 'string' && metadata.picture) ||
    null;
  return { userId: user.id, email, fullName, avatarUrl };
}
