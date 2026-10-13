'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from './supabase/server';
import { fail, ok, zodFields, type ActionResult } from './result';
import { loginSchema } from './sessionSchemas';
import { LOGIN_ROUTE, POST_LOGIN_ROUTE } from './authConstants';

/**
 * Auth session actions (feature 009 — specs/book/009-admin-auth, feature 010).
 * LIVE-ONLY: authentication relies solely on the identity provider (Supabase).
 * The local session seam was removed — without Supabase configured, sign-in
 * fails visibly instead of falling back to an in-memory user (FR-006/FR-010).
 */

export async function signIn(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos.', zodFields(parsed.error));
  }
  const { email, password } = parsed.data;

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

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase?.auth.signOut();
  redirect(LOGIN_ROUTE);
}