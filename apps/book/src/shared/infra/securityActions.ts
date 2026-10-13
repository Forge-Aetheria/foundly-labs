'use server';

import { createServerSupabaseClient } from './supabase/server';
import { hasLiveAuth } from './supabase/env';
import { getStore } from './store';
import { getEffectiveSession } from './authServer';
import { fail, ok, zodFields, type ActionResult } from './result';
import { passwordChangeSchema } from './sessionSchemas';

/**
 * Password change action (feature 009 — US5).
 * Requires an authenticated session and proof of the current password:
 * - live: re-authenticate then `auth.updateUser({ password })`.
 * - local: verify and update the in-memory credential.
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

  if (hasLiveAuth()) {
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

  const store = getStore();
  const user = store.users.find((item) => item.id === session.userId);
  if (!user || user.credential !== currentPassword) {
    return fail('UNAUTHENTICATED', 'La contraseña actual no es correcta.');
  }
  user.credential = newPassword;
  return ok({ updated: true });
}
