import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DeleteNotificationDocument,
  MarkAllNotificationsReadDocument,
  MarkNotificationReadDocument,
  NotificationType,
  NotificationsDocument,
  UnreadNotificationCountDocument,
} from '../../../shared/api/generated';
import {
  deleteNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../actions';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock('../../../shared/api/admin-request', () => ({
  apiRequestAdmin: (...args: unknown[]) => apiMock(...args),
}));

function notificationDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'n1',
    type: NotificationType.NewBooking,
    title: 'Nueva reserva online',
    message: 'Ana reservó Corte el 24/10 a las 10:00.',
    read: false,
    createdAt: '2026-10-24T10:00:00.000Z',
    ...overrides,
  };
}

describe('notifications actions (020)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists notifications with the forwarded filter and maps them', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { notifications: [notificationDto()] } });
    const result = await listNotifications({ read: false, limit: 5, offset: 0 });

    expect(apiMock).toHaveBeenCalledWith(NotificationsDocument, {
      read: false,
      limit: 5,
      offset: 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([
        {
          id: 'n1',
          type: NotificationType.NewBooking,
          title: 'Nueva reserva online',
          message: 'Ana reservó Corte el 24/10 a las 10:00.',
          read: false,
          createdAt: '2026-10-24T10:00:00.000Z',
        },
      ]);
    }
  });

  it('reads the unread count', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { unreadNotificationCount: 4 } });
    const result = await getUnreadNotificationCount();
    expect(apiMock).toHaveBeenCalledWith(UnreadNotificationCountDocument, {});
    expect(result).toEqual({ ok: true, data: 4 });
  });

  it('marks one notification as read', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { markNotificationRead: notificationDto({ read: true }) } });
    const result = await markNotificationRead('n1');
    expect(apiMock).toHaveBeenCalledWith(MarkNotificationReadDocument, { id: 'n1' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.read).toBe(true);
  });

  it('marks all notifications as read', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { markAllNotificationsRead: 3 } });
    const result = await markAllNotificationsRead();
    expect(apiMock).toHaveBeenCalledWith(MarkAllNotificationsReadDocument, {});
    expect(result).toEqual({ ok: true, data: 3 });
  });

  it('deletes a notification', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { deleteNotification: true } });
    const result = await deleteNotification('n1');
    expect(apiMock).toHaveBeenCalledWith(DeleteNotificationDocument, { id: 'n1' });
    expect(result).toEqual({ ok: true, data: { id: 'n1' } });
  });

  it('rejects an empty id before calling the API', async () => {
    const result = await markNotificationRead('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(apiMock).not.toHaveBeenCalled();
  });
});
