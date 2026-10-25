import type { Session } from '@supabase/supabase-js';
import { errorMessage } from '@/shared/api/error-surface';
import { fail, ok, type ActionResult } from '@/shared/api/result';
import { supabase } from '@/shared/auth/supabase';
import type { LoginValues } from './schemas';

export async function signIn(values: LoginValues): Promise<ActionResult<Session>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: values.email.trim(),
    password: values.password,
  });
  if (error || !data.session) {
    return fail('UNAUTHENTICATED', 'El correo o la contraseña no son correctos.');
  }
  return ok(data.session);
}

export async function signOut(): Promise<ActionResult<true>> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return fail('STATE_ERROR', errorMessage('STATE_ERROR'));
  }
  return ok(true);
}


export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePassword(
  values: ChangePasswordValues,
): Promise<ActionResult<true>> {
  if (values.newPassword.length < 8) {
    return fail('VALIDATION_ERROR', 'La nueva contraseña debe tener al menos 8 caracteres.');
  }
  if (!/[a-zA-Z]/.test(values.newPassword) || !/[0-9]/.test(values.newPassword)) {
    return fail('VALIDATION_ERROR', 'La nueva contraseña debe incluir letras y números.');
  }
  if (values.newPassword !== values.confirmPassword) {
    return fail('VALIDATION_ERROR', 'Las contraseñas nuevas no coinciden.');
  }

  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) {
    return fail('UNAUTHENTICATED', 'Tu sesión ha expirado. Inicia sesión de nuevo.');
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: values.currentPassword,
  });
  if (reauthError) {
    return fail('UNAUTHENTICATED', 'La contraseña actual no es correcta.');
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: values.newPassword,
  });
  if (updateError) {
    return fail('STATE_ERROR', 'No se pudo actualizar la contraseña. Inténtalo de nuevo.');
  }

  return ok(true);
}
