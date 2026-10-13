'use server';

import { createServerSupabaseClient } from '../../shared/auth/supabase/server';
import { getEffectiveSession } from '../../shared/auth/authServer';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import { passwordChangeSchema } from '../auth/utils/schemas';

/**
 * Security module — server actions (feature 011; constitution §5.VI).
 * Requires an authenticated Supabase session and proof of the current password.
 */
export async function changePassword(input: unknown): Promise<ActionResult<{ updated: true }>> {
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