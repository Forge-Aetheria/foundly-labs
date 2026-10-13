'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from './supabase/server';
import { hasLiveAuth } from './supabase/env';
import { getStore } from './store';
import { fail, ok, zodFields, type ActionResult } from './result';
import { loginSchema } from './sessionSchemas';
import { clearLocalSession, writeLocalSession } from './session';
import { LOGIN_ROUTE, POST_LOGIN_ROUTE } from './authConstants';

/**
 * Auth session actions (feature 009 — specs/book/009-admin-auth).
 * Live mode uses Supabase Auth; otherwise a minimal local seam authenticates
 * against the in-memory store. Secrets/tokens never leave the server.
 */

export async function signIn(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos.', zodFields(parsed.error));
  }
  const { email, password } = parsed.data;

  if (hasLiveAuth()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return fail('STATE_ERROR', 'La autenticación no está disponible.');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return fail('UNAUTHENTICATED', 'Email o contraseña incorrectos.');
    }
    return ok({ redirectTo: POST_LOGIN_ROUTE });
  }

  const user = getStore().users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase(),
  );
  if (!user || user.status !== 'active' || user.credential !== password) {
    return fail('UNAUTHENTICATED', 'Email o contraseña incorrectos.');
  }
  await writeLocalSession(user.id);
  return ok({ redirectTo: POST_LOGIN_ROUTE });
}

export async function signOut(): Promise<void> {
  if (hasLiveAuth()) {
    const supabase = await createServerSupabaseClient();
    await supabase?.auth.signOut();
  }
  await clearLocalSession();
  redirect(LOGIN_ROUTE);
}
