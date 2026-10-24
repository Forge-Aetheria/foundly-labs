import { describe, expect, it, vi } from 'vitest';
import {
  type NotificationRow,
  type NotificationStore,
} from './notifications.store';
import { NotificationsService } from './notifications.service';

function makeRow(overrides: Partial<NotificationRow> = {}): NotificationRow {
  return {
    id: 'n1',
    tenantId: 't1',
    type: 'NEW_BOOKING',
    title: 'Nueva reserva online',
    message: 'Ana reservó Corte el 24/10 a las 10:00.',
    read: false,
    createdAt: new Date('2026-10-24T10:00:00.000Z'),
    ...overrides,
  };
}

interface StoreSpies {
  store: NotificationStore;
  list: ReturnType<typeof vi.fn>;
  countUnread: ReturnType<typeof vi.fn>;
  markRead: ReturnType<typeof vi.fn>;
  markAllRead: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  latestByType: ReturnType<typeof vi.fn>;
  getSubscription: ReturnType<typeof vi.fn>;
}

function makeStore(): StoreSpies {
  const list = vi.fn(async () => [makeRow()]);
  const countUnread = vi.fn(async () => 2);
  const markRead = vi.fn(async () => makeRow({ read: true }));
  const markAllRead = vi.fn(async () => 3);
  const remove = vi.fn(async () => true);
  const create = vi.fn(async () => makeRow());
  const latestByType = vi.fn(async () => null);
  const getSubscription = vi.fn(async () => null);
  const store: NotificationStore = {
    list,
    countUnread,
    markRead,
    markAllRead,
    remove,
    create,
    latestByType,
    getSubscription,
  };
  return { store, list, countUnread, markRead, markAllRead, remove, create, latestByType, getSubscription };
}

const user = { tenantId: 't1' };

describe('NotificationsService (020 — inbox core)', () => {
  it('lists newest-first with default paging and maps to GraphQL shape', async () => {
    const spies = makeStore();
    const service = new NotificationsService(spies.store);

    const result = await service.list(user, {});

    expect(spies.list).toHaveBeenCalledWith('t1', { read: null, limit: 50, offset: 0 });
    expect(result).toEqual([
      {
        id: 'n1',
        type: 'NEW_BOOKING',
        title: 'Nueva reserva online',
        message: 'Ana reservó Corte el 24/10 a las 10:00.',
        read: false,
        createdAt: '2026-10-24T10:00:00.000Z',
      },
    ]);
  });

  it('forwards the read filter and caps the limit', async () => {
    const spies = makeStore();
    const service = new NotificationsService(spies.store);

    await service.list(user, { read: false, limit: 500, offset: 10 });

    expect(spies.list).toHaveBeenCalledWith('t1', { read: false, limit: 100, offset: 10 });
  });

  it('rejects invalid paging with VALIDATION_ERROR', async () => {
    const spies = makeStore();
    const service = new NotificationsService(spies.store);

    await expect(service.list(user, { limit: 0 })).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
    await expect(service.list(user, { offset: -1 })).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rejects a missing tenant scope with UNAUTHENTICATED', async () => {
    const spies = makeStore();
    const service = new NotificationsService(spies.store);

    await expect(service.list(undefined, {})).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
    await expect(service.countUnread({})).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  it('returns the unread count scoped to the tenant', async () => {
    const spies = makeStore();
    const service = new NotificationsService(spies.store);

    await expect(service.countUnread(user)).resolves.toBe(2);
    expect(spies.countUnread).toHaveBeenCalledWith('t1');
  });

  it('marks one notification as read', async () => {
    const spies = makeStore();
    const service = new NotificationsService(spies.store);

    const result = await service.markRead(user, 'n1');
    expect(result.read).toBe(true);
    expect(spies.markRead).toHaveBeenCalledWith('t1', 'n1');
  });

  it('fails as NOT_FOUND when marking an unknown/foreign notification', async () => {
    const spies = makeStore();
    spies.markRead.mockResolvedValueOnce(null);
    const service = new NotificationsService(spies.store);

    await expect(service.markRead(user, 'nope')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('marks all notifications as read and returns the count', async () => {
    const spies = makeStore();
    const service = new NotificationsService(spies.store);

    await expect(service.markAllRead(user)).resolves.toBe(3);
    expect(spies.markAllRead).toHaveBeenCalledWith('t1');
  });

  it('deletes a notification and fails as NOT_FOUND when none was removed', async () => {
    const spies = makeStore();
    const service = new NotificationsService(spies.store);

    await expect(service.delete(user, 'n1')).resolves.toBe(true);
    expect(spies.remove).toHaveBeenCalledWith('t1', 'n1');

    spies.remove.mockResolvedValueOnce(false);
    await expect(service.delete(user, 'nope')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });
});

describe('NotificationsService — subscription expiry sync (020 — US4)', () => {
  const DAY = 24 * 60 * 60 * 1000;

  it('creates an expiring notification within 3 days of expiry', async () => {
    const spies = makeStore();
    spies.getSubscription.mockResolvedValue({
      plan: 'PRO',
      status: 'active',
      expiresAt: new Date(Date.now() + 2 * DAY),
    });
    const service = new NotificationsService(spies.store);

    await service.syncSubscriptionNotifications('t1');

    expect(spies.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 't1', type: 'SUBSCRIPTION_EXPIRING' }),
    );
  });

  it('creates an expired notification when the expiry is in the past', async () => {
    const spies = makeStore();
    spies.getSubscription.mockResolvedValue({
      plan: 'PRO',
      status: 'expired',
      expiresAt: new Date(Date.now() - DAY),
    });
    const service = new NotificationsService(spies.store);

    await service.syncSubscriptionNotifications('t1');

    expect(spies.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 't1', type: 'SUBSCRIPTION_EXPIRED' }),
    );
  });

  it('does nothing when the expiry is far in the future or absent', async () => {
    const spies = makeStore();
    spies.getSubscription.mockResolvedValue({ plan: 'PRO', status: 'active', expiresAt: new Date(Date.now() + 30 * DAY) });
    const service = new NotificationsService(spies.store);
    await service.syncSubscriptionNotifications('t1');
    expect(spies.create).not.toHaveBeenCalled();

    spies.getSubscription.mockResolvedValue({ plan: 'FREE', status: 'active', expiresAt: null });
    await service.syncSubscriptionNotifications('t1');
    expect(spies.create).not.toHaveBeenCalled();
  });

  it('deduplicates per type within 24 h', async () => {
    const spies = makeStore();
    spies.getSubscription.mockResolvedValue({ plan: 'PRO', status: 'active', expiresAt: new Date(Date.now() + 2 * DAY) });
    spies.latestByType.mockResolvedValue(
      makeRow({ type: 'SUBSCRIPTION_EXPIRING', createdAt: new Date() }),
    );
    const service = new NotificationsService(spies.store);

    await service.syncSubscriptionNotifications('t1');

    expect(spies.create).not.toHaveBeenCalled();
  });

  it('runs the sync when listing notifications', async () => {
    const spies = makeStore();
    spies.getSubscription.mockResolvedValue({ plan: 'PRO', status: 'active', expiresAt: new Date(Date.now() - DAY) });
    const service = new NotificationsService(spies.store);

    await service.list(user, {});

    expect(spies.getSubscription).toHaveBeenCalledWith('t1');
    expect(spies.create).toHaveBeenCalledTimes(1);
  });
});
