'use client';

import { useState } from 'react';
import { Button, Card, Stack, Typography } from '@foundly/ui';
import { useNotifications } from './NotificationsProvider';
import { NotificationsList } from './components/NotificationsList';

type InboxFilter = 'all' | 'unread';

/** Full notification inbox page view (feature 020 — US2). */
export function NotificationsView() {
  const { items, unreadCount, loading, error, markRead, markAllRead, remove } = useNotifications();
  const [filter, setFilter] = useState<InboxFilter>('all');

  const visible = filter === 'unread' ? items.filter((item) => !item.read) : items;

  return (
    <Card
      header={
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ width: '100%' }}
        >
          <Stack spacing={0.25}>
            <Typography variant="h4" component="h1">
              Notificaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
            </Typography>
          </Stack>
          <Button variant="secondary" onClick={() => void markAllRead()} disabled={unreadCount === 0}>
            Marcar todas como leídas
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} role="group" aria-label="Filtrar notificaciones">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'secondary'}
            onClick={() => setFilter('unread')}
          >
            No leídas
          </Button>
        </Stack>

        <NotificationsList
          items={visible}
          loading={loading}
          error={error}
          emptyLabel={filter === 'unread' ? 'No tienes notificaciones sin leer.' : 'No tienes notificaciones.'}
          onMarkRead={(id) => void markRead(id)}
          onDelete={(id) => void remove(id)}
        />
      </Stack>
    </Card>
  );
}
