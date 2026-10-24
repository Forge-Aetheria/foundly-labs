import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { NotificationType } from '../utils/types';

const { listMock, countMock, markMock, markAllMock, deleteMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  countMock: vi.fn(),
  markMock: vi.fn(),
  markAllMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useFetchNotifications: () => listMock,
  useUnreadNotificationCount: () => countMock,
  useMarkNotificationRead: () => markMock,
  useMarkAllNotificationsRead: () => markAllMock,
  useDeleteNotification: () => deleteMock,
}));

import { NotificationsProvider } from '../NotificationsProvider';
import { NotificationsView } from '../NotificationsView';

function makeItems() {
  return [
    {
      id: 'n1',
      type: NotificationType.NewBooking,
      title: 'Nueva reserva online',
      message: 'Ana reservó Corte.',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'n2',
      type: NotificationType.SubscriptionExpired,
      title: 'Suscripción vencida',
      message: 'Tu plan ha vencido.',
      read: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function renderView() {
  return render(
    <FoundlyThemeProvider>
      <NotificationsProvider>
        <NotificationsView />
      </NotificationsProvider>
    </FoundlyThemeProvider>,
  );
}

describe('NotificationsView (020 — US2)', () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue({ ok: true, data: makeItems() });
    countMock.mockReset().mockResolvedValue({ ok: true, data: 1 });
    markMock.mockReset().mockResolvedValue({ ok: true, data: { ...makeItems()[0], read: true } });
    markAllMock.mockReset().mockResolvedValue({ ok: true, data: 1 });
    deleteMock.mockReset().mockResolvedValue({ ok: true, data: { id: 'n1' } });
  });

  it('renders the header with the unread count and both filters', async () => {
    renderView();
    expect(await screen.findByRole('heading', { name: 'Notificaciones' })).toBeInTheDocument();
    expect(screen.getByText('1 sin leer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No leídas' })).toBeInTheDocument();
    expect(screen.getByText('Nueva reserva online')).toBeInTheDocument();
    expect(screen.getByText('Suscripción vencida')).toBeInTheDocument();
  });

  it('is accessible', async () => {
    const { container } = renderView();
    await screen.findByText('Nueva reserva online');
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('filters to unread only', async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findByText('Nueva reserva online');

    await user.click(screen.getByRole('button', { name: 'No leídas' }));

    expect(screen.getByText('Nueva reserva online')).toBeInTheDocument();
    expect(screen.queryByText('Suscripción vencida')).toBeNull();
  });

  it('marks an item as read when clicked and updates the count', async () => {
    const user = userEvent.setup();
    renderView();
    const itemButton = await screen.findByRole('button', {
      name: 'Marcar como leída: Nueva reserva online',
    });

    await user.click(itemButton);

    expect(markMock).toHaveBeenCalledWith('n1');
    expect(await screen.findByText('Todo al día')).toBeInTheDocument();
  });

  it('deletes a notification permanently', async () => {
    const user = userEvent.setup();
    renderView();
    const deleteButton = await screen.findByRole('button', {
      name: 'Eliminar: Nueva reserva online',
    });

    await user.click(deleteButton);

    expect(deleteMock).toHaveBeenCalledWith('n1');
    expect(screen.queryByText('Nueva reserva online')).toBeNull();
  });

  it('marks all as read from the header action', async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findByText('Nueva reserva online');

    await user.click(screen.getByRole('button', { name: 'Marcar todas como leídas' }));

    expect(markAllMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Todo al día')).toBeInTheDocument();
  });

  it('renders the empty state when there are no notifications', async () => {
    listMock.mockResolvedValue({ ok: true, data: [] });
    countMock.mockResolvedValue({ ok: true, data: 0 });
    renderView();

    expect(await screen.findByText('No tienes notificaciones.')).toBeInTheDocument();
  });

  it('renders the error state when the inbox fails to load', async () => {
    listMock.mockResolvedValue({ ok: false, error: { code: 'STATE_ERROR', message: 'No disponible.' } });
    renderView();

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('No disponible.')).toBeInTheDocument();
  });
});
