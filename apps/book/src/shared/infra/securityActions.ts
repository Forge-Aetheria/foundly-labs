'use server';

import { createServerSupabaseClient } from './supabase/server';
import { getEffectiveSession } from './authServer';
import { fail, ok, zodFields, type ActionResult } from './result';
import { passwordChangeSchema } from './sessionSchemas';

/**
 * Password change action (feature 009 — US5, feature 010 — live-only).
 * Requires an authenticated Supabase session and proof of the current password:
 * re-authenticate, then `auth.updateUser({ password })`. No local seam.
 */
export async function changePassword(
  input: unknown,
): Promise<ActionResult<{ updated: true }>> {
  const session = await getEffectiveSession();
  if (!session) {
    return fail('UNAUTHENTICATED', 'Tu sesión ha caducado. Vuelve a iniciar sesión.');
  }

  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos.', zodFields(parsed.error));
  }
  const { currentPassword, newPassword } = parsed.data;

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return fail('STATE_ERROR', 'La autenticación no está disponible.');
  }
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) {
    return fail('UNAUTHENTICATED', 'Tu sesión ha caducado. Vuelve a iniciar sesión.');
  }
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (reauthError) {
    return fail('UNAUTHENTICATED', 'La contraseña actual no es correcta.');
  }
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return fail('STATE_ERROR', 'No se pudo actualizar la contraseña. Inténtalo de nuevo.');
  }
  return ok({ updated: true });
}