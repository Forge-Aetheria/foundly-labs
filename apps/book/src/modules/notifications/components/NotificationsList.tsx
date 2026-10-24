'use client';

import Box from '@mui/material/Box';
import { Stack, Typography } from '@foundly/ui';
import type { Notification } from '../utils/types';
import { NotificationItem } from './NotificationItem';

export interface NotificationsListProps {
  items: Notification[];
  loading: boolean;
  error: string | null;
  emptyLabel: string;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Inbox list with loading, empty and error states. */
export function NotificationsList({
  items,
  loading,
  error,
  emptyLabel,
  onMarkRead,
  onDelete,
}: NotificationsListProps) {
  if (loading) {
    return (
      <Box sx={{ px: 2, py: 4 }}>
        <Typography variant="body2" color="text.secondary" role="status">
          Cargando notificaciones…
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ px: 2, py: 4 }}>
        <Typography variant="body2" role="alert" sx={{ color: 'error.main' }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Stack spacing={0.5} sx={{ px: 2, py: 6, alignItems: 'center', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {emptyLabel}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Aquí aparecerán tus reservas y avisos de cuenta.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box component="ul" aria-label="Notificaciones" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
}
