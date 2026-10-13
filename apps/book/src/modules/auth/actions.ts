'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../../shared/auth/supabase/server';
import { LOGIN_ROUTE, POST_LOGIN_ROUTE } from '../../shared/auth/authConstants';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import { loginSchema } from './utils/schemas';

/**
 * Auth module — server actions (feature 011; constitution §5.VI).
 * LIVE-ONLY: authentication relies solely on the identity provider (Supabase).
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