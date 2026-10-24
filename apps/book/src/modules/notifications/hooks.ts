'use client';

import type { ActionResult } from '../../shared/types/result';
import type { Notification } from './utils/types';
import {
  deleteNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationFilter,
} from './actions';

/**
 * Notifications client hooks (feature 020; constitution §5.VI).
 * The wrappers are defined at module scope so their identity is stable across
 * renders (used as effect/callback dependencies by the shared provider).
 */
function fetchNotifications(filter?: NotificationFilter): Promise<ActionResult<Notification[]>> {
  return listNotifications(filter);
}

function fetchUnreadCount(): Promise<ActionResult<number>> {
  return getUnreadNotificationCount();
}

function markRead(id: string): Promise<ActionResult<Notification>> {
  return markNotificationRead(id);
}

function markAllRead(): Promise<ActionResult<number>> {
  return markAllNotificationsRead();
}

function remove(id: string): Promise<ActionResult<{ id: string }>> {
  return deleteNotification(id);
}

export function useFetchNotifications(): (
  filter?: NotificationFilter,
) => Promise<ActionResult<Notification[]>> {
  return fetchNotifications;
}

export function useUnreadNotificationCount(): () => Promise<ActionResult<number>> {
  return fetchUnreadCount;
}

export function useMarkNotificationRead(): (id: string) => Promise<ActionResult<Notification>> {
  return markRead;
}

export function useMarkAllNotificationsRead(): () => Promise<ActionResult<number>> {
  return markAllRead;
}

export function useDeleteNotification(): (id: string) => Promise<ActionResult<{ id: string }>> {
  return remove;
}
