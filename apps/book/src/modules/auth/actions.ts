'use server';

import { redirect } from 'next/navigation';
import { apiRequest } from '../../shared/api/client';
import { ViewerDocument } from '../../shared/api/generated';
import { createServerSupabaseClient } from '../../shared/auth/supabase/server';
import { LOGIN_ROUTE, POST_LOGIN_ROUTE } from '../../shared/auth/authConstants';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import { loginSchema } from './utils/schemas';

/**
 * Auth module — server actions (feature 011; constitution §5.VI).
 * LIVE-ONLY: authentication relies solely on the identity provider (Supabase).
 * Feature 012: sign-in also verifies the API accepts the token, so an
 * authentication/backend mismatch surfaces HERE (on `/login`) instead of as
 * broken errors scattered across the admin views.
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return fail('UNAUTHENTICATED', 'Email o contraseña incorrectos.');
  }

  // Consistency gate (login ↔ API): the backend must accept the freshly issued
  // access token. Otherwise the owner would "log in" only to have every admin
  // request rejected later.
  const token = data.session?.access_token ?? null;
  if (!token) {
    await supabase.auth.signOut();
    return fail('UNAUTHENTICATED', 'No pudimos completar la sesión. Inténtalo de nuevo.');
  }
  const verified = await apiRequest(ViewerDocument, {}, { token });
  if (!verified.ok) {
    await supabase.auth.signOut();
    if (verified.error.code === 'STATE_ERROR') {
      return fail(
        'STATE_ERROR',
        'No pudimos conectar con el servicio. Vuelve a intentarlo en unos minutos.',
      );
    }
    return fail('UNAUTHENTICATED', 'Tu cuenta no pudo validarse con el servicio.');
  }

  return ok({ redirectTo: POST_LOGIN_ROUTE });
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase?.auth.signOut();
  redirect(LOGIN_ROUTE);
}
