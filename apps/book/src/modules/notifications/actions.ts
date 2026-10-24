'use server';

import { apiRequestAdmin } from '../../shared/api/admin-request';
import {
  DeleteNotificationDocument,
  MarkAllNotificationsReadDocument,
  MarkNotificationReadDocument,
  NotificationsDocument,
  UnreadNotificationCountDocument,
  type NotificationsQuery,
} from '../../shared/api/generated';
import { fail, ok, type ActionResult } from '../../shared/types/result';
import type { Notification } from './utils/types';

/**
 * Notifications module — server data access (feature 020; constitution §5.VI).
 * Codegen documents/types only; reads/writes go through the session-aware transport.
 */

type ApiNotification = NotificationsQuery['notifications'][number];

export interface NotificationFilter {
  read?: boolean | null;
  limit?: number | null;
  offset?: number | null;
}

function mapNotification(dto: ApiNotification): Notification {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    message: dto.message,
    read: dto.read,
    createdAt: dto.createdAt,
  };
}

/** The authenticated business's notifications (newest first). SERVER-ONLY. */
export async function listNotifications(
  filter: NotificationFilter = {},
): Promise<ActionResult<Notification[]>> {
  const result = await apiRequestAdmin(NotificationsDocument, {
    read: filter.read ?? null,
    limit: filter.limit ?? null,
    offset: filter.offset ?? null,
  });
  if (!result.ok) return result;
  return ok(result.data.notifications.map(mapNotification));
}

/** The authenticated business's unread count. SERVER-ONLY. */
export async function getUnreadNotificationCount(): Promise<ActionResult<number>> {
  const result = await apiRequestAdmin(UnreadNotificationCountDocument, {});
  if (!result.ok) return result;
  return ok(result.data.unreadNotificationCount);
}

/** Mark one notification as read (idempotent). */
export async function markNotificationRead(id: string): Promise<ActionResult<Notification>> {
  if (!id) return fail('VALIDATION_ERROR', 'Notificación inválida.');
  const result = await apiRequestAdmin(MarkNotificationReadDocument, { id });
  if (!result.ok) return result;
  return ok(mapNotification(result.data.markNotificationRead));
}

/** Mark all notifications as read; returns the count updated. */
export async function markAllNotificationsRead(): Promise<ActionResult<number>> {
  const result = await apiRequestAdmin(MarkAllNotificationsReadDocument, {});
  if (!result.ok) return result;
  return ok(result.data.markAllNotificationsRead);
}

/** Permanently delete one notification. */
export async function deleteNotification(id: string): Promise<ActionResult<{ id: string }>> {
  if (!id) return fail('VALIDATION_ERROR', 'Notificación inválida.');
  const result = await apiRequestAdmin(DeleteNotificationDocument, { id });
  if (!result.ok) return result;
  return ok({ id });
}
