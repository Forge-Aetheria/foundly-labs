'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import { Stack, Typography } from '@foundly/ui';
import { useNotifications } from '../NotificationsProvider';
import { formatRelativeTime } from '../utils/relativeTime';
import { notificationMeta } from '../utils/notificationMeta';

const QUICK_VIEW_COUNT = 5;

/** Header bell with the dynamic unread badge and a quick-view dropdown. */
export function NotificationBell() {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const latest = items.slice(0, QUICK_VIEW_COUNT);

  function handleOpen(event: MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
  }
  function handleClose() {
    setAnchorEl(null);
  }

  const ariaLabel =
    unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones';

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={open || undefined}
        size="small"
      >
        <Badge
          badgeContent={unreadCount}
          max={99}
          invisible={unreadCount === 0}
          color="primary"
          overlap="circular"
        >
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, maxWidth: '92vw' } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
            Notificaciones
          </Typography>
        </Box>
        <Divider />

        {latest.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No tienes notificaciones.
            </Typography>
          </Box>
        ) : (
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {latest.map((notification) => {
              const meta = notificationMeta(notification.type);
              const Icon = meta.icon;
              return (
                <Box
                  component="li"
                  key={notification.id}
                  onClick={() => {
                    void markRead(notification.id);
                    handleClose();
                  }}
                  sx={{
                    display: 'flex',
                    gap: 1.25,
                    px: 2,
                    py: 1.25,
                    cursor: 'pointer',
                    backgroundColor: notification.read ? 'transparent' : 'surface.badgePill',
                    '&:hover': { backgroundColor: 'surface.cardHover' },
                  }}
                >
                  <Box sx={{ color: 'primary.main', display: 'flex', pt: 0.25 }}>
                    <Icon fontSize="small" aria-hidden="true" />
                  </Box>
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: notification.read ? 500 : 700 }} noWrap>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatRelativeTime(notification.createdAt)}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        )}

        <Divider />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            size="small"
            onClick={() => {
              void markAllRead();
              handleClose();
            }}
            disabled={unreadCount === 0}
          >
            Marcar todas como leídas
          </Button>
          <Button
            fullWidth
            size="small"
            component={Link}
            href="/admin/notificaciones"
            onClick={handleClose}
          >
            Ver todas las notificaciones
          </Button>
        </Box>
      </Menu>
    </>
  );
}
