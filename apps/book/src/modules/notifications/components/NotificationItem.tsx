'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { Stack, Typography } from '@foundly/ui';
import type { Notification } from '../utils/types';
import { notificationMeta } from '../utils/notificationMeta';
import { formatRelativeTime } from '../utils/relativeTime';

export interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

/** One inbox row: themed icon, content (click = mark read), relative time and delete. */
export function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const meta = notificationMeta(notification.type);
  const Icon = meta.icon;

  return (
    <Box
      component="li"
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 2,
        py: 1.75,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: notification.read ? 'transparent' : 'surface.badgePill',
        '&:last-of-type': { borderBottom: 0 },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'primary.light',
          color: 'primary.dark',
        }}
      >
        <Icon fontSize="small" aria-hidden="true" />
      </Box>

      <Box
        role="button"
        tabIndex={0}
        aria-label={`Marcar como leída: ${notification.title}`}
        onClick={() => {
          if (!notification.read) onMarkRead(notification.id);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!notification.read) onMarkRead(notification.id);
          }
        }}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          cursor: notification.read ? 'default' : 'pointer',
          borderRadius: 1,
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        <Stack spacing={0.25}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {notification.read ? null : (
              <Box
                aria-hidden="true"
                sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'primary.main', flexShrink: 0 }}
              />
            )}
            <Typography
              variant="body2"
              component="span"
              sx={{ fontWeight: notification.read ? 500 : 700 }}
            >
              {notification.title}
            </Typography>
          </Stack>
          <Typography variant="body2" component="span" color="text.secondary">
            {notification.message}
          </Typography>
          <Typography variant="caption" component="span" color="text.disabled">
            {meta.label} · {formatRelativeTime(notification.createdAt)}
          </Typography>
        </Stack>
      </Box>

      <IconButton
        onClick={() => onDelete(notification.id)}
        aria-label={`Eliminar: ${notification.title}`}
        size="small"
        sx={{ flexShrink: 0 }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
