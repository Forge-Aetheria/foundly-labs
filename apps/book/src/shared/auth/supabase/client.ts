'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { liveAuthEnv } from './env';

let client: SupabaseClient | null = null;

/** Browser Supabase client singleton (feature 008 — session-auth.contract.md). */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  const env = liveAuthEnv();
  if (!env) return null;
  client ??= createBrowserClient(env.url, env.anonKey);
  return client;
}