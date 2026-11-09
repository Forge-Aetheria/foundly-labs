import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../shared/api/query-client';
import { useSession } from '../../shared/auth/session-context';
import {
  deleteNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './services';
import type { Notification } from './utils/types';

/** Max items loaded into the shared inbox state (the API caps at 100). */
const INBOX_LIMIT = 100;

export interface NotificationsContextValue {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/**
 * Shares the tenant inbox between the admin header bell and the
 * `/admin/notificaciones` page through the TanStack cache (feature 024).
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();
  const listKey = queryKeys.notifications(tenantId, 'inbox');
  const countKey = queryKeys.notifications(tenantId, 'unread-count');

  const listQuery = useQuery({
    queryKey: listKey,
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const result = await listNotifications({ limit: INBOX_LIMIT });
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });

  const countQuery = useQuery({
    queryKey: countKey,
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const result = await getUnreadNotificationCount();
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['notifications', tenantId] });
  }, [queryClient, tenantId]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await markNotificationRead(id);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: (id: string) => {
      const items = queryClient.getQueryData<Notification[]>(listKey) ?? [];
      const target = items.find((item) => item.id === id);
      if (target && !target.read) {
        queryClient.setQueryData<Notification[]>(listKey, (current) =>
          (current ?? []).map((item) => (item.id === id ? { ...item, read: true } : item)),
        );
        queryClient.setQueryData<number>(countKey, (count) => Math.max(0, (count ?? 0) - 1));
      }
    },
    onError: () => { void invalidate(); },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const result = await markAllNotificationsRead();
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: () => {
      queryClient.setQueryData<Notification[]>(listKey, (current) =>
        (current ?? []).map((item) => ({ ...item, read: true })),
      );
      queryClient.setQueryData<number>(countKey, 0);
    },
    onError: () => { void invalidate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteNotification(id);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: (id: string) => {
      const items = queryClient.getQueryData<Notification[]>(listKey) ?? [];
      const target = items.find((item) => item.id === id);
      queryClient.setQueryData<Notification[]>(listKey, (current) =>
        (current ?? []).filter((item) => item.id !== id),
      );
      if (target && !target.read) {
        queryClient.setQueryData<number>(countKey, (count) => Math.max(0, (count ?? 0) - 1));
      }
    },
    onError: () => { void invalidate(); },
  });

  const refresh = useCallback(async () => {
    await Promise.all([listQuery.refetch(), countQuery.refetch()]);
  }, [listQuery, countQuery]);

  const markRead = useCallback(
    async (id: string) => {
      await markReadMutation.mutateAsync(id);
    },
    [markReadMutation],
  );

  const markAllRead = useCallback(async () => {
    await markAllMutation.mutateAsync();
  }, [markAllMutation]);

  const remove = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items: listQuery.data ?? [],
      unreadCount: countQuery.data ?? 0,
      loading: listQuery.isLoading || countQuery.isLoading,
      error: listQuery.isError ? listQuery.error.message : null,
      refresh,
      markRead,
      markAllRead,
      remove,
    }),
    [countQuery.data, countQuery.isLoading, listQuery.data, listQuery.error, listQuery.isError, listQuery.isLoading, markAllRead, markRead, refresh, remove],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

/** Access the shared notifications state; must be used within a provider. */
export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
