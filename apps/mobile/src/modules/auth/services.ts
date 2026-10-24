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
