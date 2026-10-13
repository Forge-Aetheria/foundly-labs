import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { liveAuthEnv } from './env';
import { toNextResponseCookieOptions } from './cookies';

/**
 * Per-request Supabase server client (Next 15 async `cookies()`).
 * MUST be created per request — the cookie store derives from the request.
 * Writes are only legal in Server Actions / Route Handlers; emitted per cookie
 * and swallowed when not permitted (refresh happens in the middleware).
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const env = liveAuthEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values: { name: string; value: string; options: CookieOptions }[]) => {
        for (const { name, value, options } of values) {
          try {
            cookieStore.set(name, value, toNextResponseCookieOptions(options));
          } catch {
            // redirected refresh is owned by src/middleware.ts
          }
        }
      },
    },
  });
}