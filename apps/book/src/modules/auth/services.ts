import { apiRequest } from '../../shared/api/client';
import { ViewerDocument } from '../../shared/api/generated';
import { POST_LOGIN_ROUTE } from '../../shared/auth/authConstants';
import { createBrowserSupabaseClient } from '../../shared/auth/supabase';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import { loginSchema } from './utils/schemas';

/**
 * Auth module — client data access (feature 024).
 * LIVE-ONLY: authentication relies solely on the identity provider (Supabase).
 * Sign-in also verifies the API accepts the token so an auth/backend mismatch
 * surfaces on `/login` instead of as broken errors across the admin views.
 */

export async function signIn(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos.', zodFields(parsed.error));
  }
  const { email, password } = parsed.data;

  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return fail('STATE_ERROR', 'La autenticación no está disponible.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return fail('UNAUTHENTICATED', 'Email o contraseña incorrectos.');
  }

  const token = data.session?.access_token ?? null;
  if (!token) {
    await supabase.auth.signOut();
    return fail('UNAUTHENTICATED', 'No pudimos completar la sesión. Inténtalo de nuevo.');
  }

  // Consistency gate (login ↔ API): the backend must accept the issued token.
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
  await createBrowserSupabaseClient()?.auth.signOut();
}
