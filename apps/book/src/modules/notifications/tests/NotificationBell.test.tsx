import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test-utils/testQueryClient';
import { NotificationType } from '../utils/types';

const { listMock, countMock, markMock, markAllMock, deleteMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  countMock: vi.fn(),
  markMock: vi.fn(),
  markAllMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('../services', () => ({
  listNotifications: (...args: unknown[]) => listMock(...args),
  getUnreadNotificationCount: (...args: unknown[]) => countMock(...args),
  markNotificationRead: (...args: unknown[]) => markMock(...args),
  markAllNotificationsRead: (...args: unknown[]) => markAllMock(...args),
  deleteNotification: (...args: unknown[]) => deleteMock(...args),
}));

vi.mock('../../../shared/auth/session-context', () => ({
  useSession: () => ({
    status: 'authenticated',
    session: null,
    userId: 'user-test',
    tenantId: 'ten-test',
    refresh: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { NotificationsProvider } from '../NotificationsProvider';
import { NotificationBell } from '../components/NotificationBell';

function makeItems() {
  return [
    {
      id: 'n1',
      type: NotificationType.NewBooking,
      title: 'Nueva reserva online',
      message: 'Ana reservó Corte el 24/10 a las 10:00.',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'n2',
      type: NotificationType.SubscriptionExpiring,
      title: 'Tu suscripción vence pronto',
      message: 'Renueva para mantener el plan Pro.',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

function renderBell() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}><FoundlyThemeProvider><MemoryRouter>
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>
    </MemoryRouter></FoundlyThemeProvider></QueryClientProvider>,
  );
}

describe('NotificationBell (020 — US1)', () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue({ ok: true, data: makeItems() });
    countMock.mockReset().mockResolvedValue({ ok: true, data: 2 });
    markMock.mockReset().mockResolvedValue({ ok: true, data: { ...makeItems()[0], read: true } });
    markAllMock.mockReset().mockResolvedValue({ ok: true, data: 2 });
    deleteMock.mockReset().mockResolvedValue({ ok: true, data: { id: 'n1' } });
  });

  it('shows the unread badge and opens the quick view with the latest items', async () => {
    const user = userEvent.setup();
    renderBell();

    const bell = await screen.findByRole('button', { name: 'Notificaciones, 2 sin leer' });
    await user.click(bell);

    expect(screen.getByText('Nueva reserva online')).toBeInTheDocument();
    expect(screen.getByText('Tu suscripción vence pronto')).toBeInTheDocument();
    const viewAll = screen.getByRole('link', { name: 'Ver todas las notificaciones' });
    expect(viewAll).toHaveAttribute('href', '/admin/notificaciones');
  });

  it('marks all as read and clears the badge', async () => {
    const user = userEvent.setup();
    renderBell();

    await user.click(await screen.findByRole('button', { name: 'Notificaciones, 2 sin leer' }));
    await user.click(screen.getByRole('button', { name: 'Marcar todas como leídas' }));

    expect(markAllMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('button', { name: 'Notificaciones' })).toBeInTheDocument();
  });

  it('is accessible', async () => {
    const user = userEvent.setup();
    const { container } = renderBell();
    await user.click(await screen.findByRole('button', { name: 'Notificaciones, 2 sin leer' }));
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('shows a clean empty state', async () => {
    listMock.mockResolvedValue({ ok: true, data: [] });
    countMock.mockResolvedValue({ ok: true, data: 0 });
    const user = userEvent.setup();
    renderBell();

    await user.click(await screen.findByRole('button', { name: 'Notificaciones' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('No tienes notificaciones.')).toBeInTheDocument();
  });
});
