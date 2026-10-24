import { describe, expect, it, vi } from 'vitest';
import { PushPlatform } from './push-tokens.types';
import { PushTokensService } from './push-tokens.service';
import type { PushDeviceTokenRow, PushTokenStore } from './push-tokens.store';

function row(overrides: Partial<PushDeviceTokenRow> = {}): PushDeviceTokenRow {
  return {
    id: 'pt1',
    tenantId: 't1',
    userId: 'u1',
    token: 'ExponentPushToken[abc123]',
    platform: 'ANDROID',
    deviceId: null,
    createdAt: new Date('2026-10-24T10:00:00.000Z'),
    updatedAt: new Date('2026-10-24T10:00:00.000Z'),
    lastSeenAt: new Date('2026-10-24T10:00:00.000Z'),
    ...overrides,
  };
}

function makeStore(): {
  store: PushTokenStore;
  upsert: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
} {
  const upsert = vi.fn(async () => row());
  const remove = vi.fn(async () => true);
  return {
    upsert,
    remove,
    store: {
      upsert,
      remove,
      listByTenant: vi.fn(async () => []),
      removeByToken: vi.fn(async () => undefined),
    },
  };
}

describe('PushTokensService', () => {
  it('registers a valid token scoped to the authenticated tenant and user', async () => {
    const { store, upsert } = makeStore();
    const service = new PushTokensService(store);

    const result = await service.register(
      { sub: 'u1', tenantId: 't1' },
      { token: 'ExponentPushToken[abc123]', platform: PushPlatform.ANDROID },
    );

    expect(result.id).toBe('pt1');
    expect(upsert).toHaveBeenCalledWith({
      tenantId: 't1',
      userId: 'u1',
      token: 'ExponentPushToken[abc123]',
      platform: 'ANDROID',
      deviceId: null,
    });
  });

  it('re-registers idempotently through the upsert seam', async () => {
    const { store, upsert } = makeStore();
    const service = new PushTokensService(store);

    await service.register(
      { sub: 'u2', tenantId: 't2' },
      { token: 'ExpoPushToken[xyz]', platform: PushPlatform.IOS, deviceId: 'device-1' },
    );
    await service.register(
      { sub: 'u2', tenantId: 't2' },
      { token: 'ExpoPushToken[xyz]', platform: PushPlatform.IOS, deviceId: 'device-1' },
    );

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ tenantId: 't2', deviceId: 'device-1' }),
    );
  });

  it('rejects missing tenant scope and malformed tokens', async () => {
    const { store } = makeStore();
    const service = new PushTokensService(store);

    await expect(
      service.register(
        { sub: 'u1' },
        { token: 'ExponentPushToken[abc]', platform: PushPlatform.IOS },
      ),
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });

    await expect(
      service.register(
        { sub: 'u1', tenantId: 't1' },
        { token: 'not-a-token', platform: PushPlatform.IOS },
      ),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
  });

  it('unregisters only within the authenticated tenant', async () => {
    const { store, remove } = makeStore();
    const service = new PushTokensService(store);

    await expect(service.unregister({ tenantId: 't1' }, 'ExpoPushToken[xyz]')).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith('t1', 'ExpoPushToken[xyz]');
    await expect(service.unregister(undefined, 'ExpoPushToken[xyz]')).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });
});
