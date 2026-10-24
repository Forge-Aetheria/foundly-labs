import { MyAppointmentsDocument, type MyAppointmentsQuery } from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, type ActionResult } from '@/shared/api/result';

export type AgendaEntry = MyAppointmentsQuery['myAppointments'][number];

export async function fetchAgenda(from: string, to: string): Promise<ActionResult<AgendaEntry[]>> {
  const token = await getAccessToken();
  if (!token) {
    return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  }
  return apiRequest<MyAppointmentsQuery>(MyAppointmentsDocument, { from, to }, { token }).then(
    (result) => (result.ok ? { ok: true as const, data: result.data.myAppointments } : result),
  );
}
