import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase admin client (feature 024).
 * The service role key must never leave the API runtime.
 */
export interface SupabaseAdminEnv {
  url: string;
  serviceRoleKey: string;
}

export function supabaseAdminEnv(): SupabaseAdminEnv | null {
  const url = process.env.SUPABASE_URL?.trim() ?? process.env.SUPABASE_AUTH_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && serviceRoleKey ? { url, serviceRoleKey } : null;
}

export function createSupabaseAdminClient(): SupabaseClient | null {
  const env = supabaseAdminEnv();
  if (!env) {
    return null;
  }
  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
