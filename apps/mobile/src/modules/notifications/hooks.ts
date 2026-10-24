import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/shared/auth/session-context';
import type { ErrorCode } from '@/shared/api/result';
import { fetchNotifications, markNotificationRead, type InboxNotification } from './services';

export class NotificationsError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'NotificationsError';
  }
}

function queryKey(tenantId: string | null) {
  return ['notifications', tenantId] as const;
}

export function useNotifications() {
  const { tenantId } = useSession();

  return useQuery<InboxNotification[], NotificationsError>({
    queryKey: queryKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const result = await fetchNotifications();
      if (!result.ok) throw new NotificationsError(result.code, result.message);
      return result.data;
    },
  });
}

export function useMarkNotificationRead() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, NotificationsError, string, { previous?: InboxNotification[] }>({
    mutationFn: async (id) => {
      const result = await markNotificationRead(id);
      if (!result.ok) throw new NotificationsError(result.code, result.message);
      return true;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKey(tenantId) });
      const previous = queryClient.getQueryData<InboxNotification[]>(queryKey(tenantId));
      queryClient.setQueryData<InboxNotification[]>(queryKey(tenantId), (current) =>
        current?.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey(tenantId), context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKey(tenantId) });
    },
  });
}
