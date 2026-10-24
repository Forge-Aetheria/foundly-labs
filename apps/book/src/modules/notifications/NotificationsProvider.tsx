'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  useDeleteNotification,
  useFetchNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUnreadNotificationCount,
} from './hooks';
import type { Notification } from './utils/types';

/** Max items loaded into the shared inbox state (the API caps at 100). */
const INBOX_LIMIT = 100;

export interface NotificationsContextValue {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  /** Reload items + unread count from the API. */
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/**
 * Shares the tenant inbox between the admin header bell and the
 * `/admin/notificaciones` page so read/delete changes stay in sync immediately.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const fetchNotifications = useFetchNotifications();
  const fetchUnreadCount = useUnreadNotificationCount();
  const markReadAction = useMarkNotificationRead();
  const markAllReadAction = useMarkAllNotificationsRead();
  const deleteAction = useDeleteNotification();

  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const [listResult, countResult] = await Promise.all([
      fetchNotifications({ limit: INBOX_LIMIT }),
      fetchUnreadCount(),
    ]);
    if (!mounted.current) return;
    if (!listResult.ok) {
      setError(listResult.error.message);
      setLoading(false);
      return;
    }
    setItems(listResult.data);
    if (countResult.ok) {
      setUnreadCount(countResult.data);
    }
    setError(null);
    setLoading(false);
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id);
      if (!target || target.read) return;
      setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
      const result = await markReadAction(id);
      if (!result.ok) await refresh();
    },
    [items, markReadAction, refresh],
  );

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    const result = await markAllReadAction();
    if (!result.ok) await refresh();
  }, [markAllReadAction, refresh]);

  const remove = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (target && !target.read) setUnreadCount((count) => Math.max(0, count - 1));
      const result = await deleteAction(id);
      if (!result.ok) await refresh();
    },
    [items, deleteAction, refresh],
  );

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, loading, error, refresh, markRead, markAllRead, remove }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

/** Access the shared notifications state; must be used within the provider. */
export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
