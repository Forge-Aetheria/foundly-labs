/**
 * Public SPA configuration (feature 024). Only `VITE_*` values are exposed to the
 * browser bundle; no secrets may ever be declared here.
 *
 * Values are exposed through getters so tests can `vi.stubEnv(...)` without
 * re-importing the module.
 */

function trimmed(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export const env = {
  get apiUrl(): string {
    return trimmed(import.meta.env.VITE_API_URL).replace(/\/+$/, '');
  },
  get supabaseUrl(): string {
    return trimmed(import.meta.env.VITE_SUPABASE_URL);
  },
  get supabaseAnonKey(): string {
    return trimmed(import.meta.env.VITE_SUPABASE_ANON_KEY);
  },
  get apiRequestTimeoutMs(): number {
    return Number(import.meta.env.VITE_API_REQUEST_TIMEOUT_MS ?? '') || 10_000;
  },
} as const;

export function hasSupabaseEnv(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
