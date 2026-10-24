import {
  MarkNotificationReadDocument,
  NotificationsDocument,
  type MarkNotificationReadMutation,
  type NotificationsQuery,
} from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, ok, type ActionResult } from '@/shared/api/result';

export type InboxNotification = NotificationsQuery['notifications'][number];

export async function fetchNotifications(): Promise<ActionResult<InboxNotification[]>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<NotificationsQuery>(
    NotificationsDocument,
    { limit: 50 },
    { token },
  );
  return result.ok ? ok(result.data.notifications) : result;
}

export async function markNotificationRead(id: string): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<MarkNotificationReadMutation>(
    MarkNotificationReadDocument,
    { id },
    { token },
  );
  return result.ok ? ok(true) : result;
}
