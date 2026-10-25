import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { secureStorage } from './secure-storage';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? null;
  if (!token) {
    console.warn('[foundly-api] Sin access token: la petición a la API no se enviará.');
  }
  return token;
}
