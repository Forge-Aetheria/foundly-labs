/** Supabase environment helpers — no framework imports (safe for middleware/Edge). */
export interface LiveAuthEnv {
  url: string;
  anonKey: string;
}

/** Public Auth client env (browser + server). Absent ⇒ live auth is disabled. */
export function liveAuthEnv(): LiveAuthEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? { url, anonKey } : null;
}

/** Server-only admin env (service role). Absent ⇒ tenant binding is disabled. */
export function supabaseAdminEnv(): { url: string; serviceRoleKey: string } | null {
  const url = process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && serviceRoleKey ? { url, serviceRoleKey } : null;
}

/** Whether live Supabase integration is configured at all (feature 008). */
export function hasLiveAuth(): boolean {
  return liveAuthEnv() !== null;
}