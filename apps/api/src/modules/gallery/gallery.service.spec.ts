import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryGalleryStore, type MemoryGalleryStore } from './gallery.test-store';
import { GalleryService } from './gallery.service';
import type { AddGalleryItemInput } from './gallery.types';

const T1 = 'tenant-1';
const T2 = 'tenant-2';

function scoped(tenantId?: string): { tenantId?: string } {
  return { tenantId };
}

function input(overrides: Partial<AddGalleryItemInput> = {}): AddGalleryItemInput {
  return { url: 'https://example.com/a.jpg', ...overrides };
}

function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  return expect(promise).rejects.toThrowError(expect.objectContaining({ extensions: { code } }));
}

describe('GalleryService (012-gallery-management)', () => {
  let store: MemoryGalleryStore;
  let service: GalleryService;

  beforeEach(() => {
    store = createMemoryGalleryStore();
    service = new GalleryService(store);
  });

  it('lists an empty gallery by id, by slug and for an unknown slug', async () => {
    store.tenantBySlug('estudio-ana', T1);
    expect(await service.list({ tenantId: T1 })).toEqual([]);
    expect(await service.list({ tenantSlug: 'estudio-ana' })).toEqual([]);
    expect(await service.list({ tenantSlug: 'unknown' })).toEqual([]);
  });

  it('adds photos in order and isolates tenants', async () => {
    const a = await service.add(scoped(T1), input({ url: 'https://example.com/1.jpg', title: 'Uno' }));
    expect(a.order).toBe(0);
    const b = await service.add(
      scoped(T1),
      input({ url: 'https://example.com/2.jpg', category: 'TRABAJOS' }),
    );
    expect(b.order).toBe(1);
    expect(b.category).toBe('trabajos');
    expect((await service.list({ tenantId: T1 })).map((row) => row.id)).toEqual([a.id, b.id]);
    expect(await service.list({ tenantId: T2 })).toEqual([]);
  });

  it('rejects anonymous and non-tenant-bound adds', async () => {
    await expectCode(service.add(undefined, input()), 'UNAUTHENTICATED');
    await expectCode(service.add({}, input()), 'UNAUTHENTICATED');
  });

  it('rejects an invalid URL and an unknown category', async () => {
    await expectCode(service.add(scoped(T1), input({ url: '' })), 'VALIDATION_ERROR');
    await expectCode(service.add(scoped(T1), input({ url: 'not-a-url' })), 'VALIDATION_ERROR');
    await expectCode(service.add(scoped(T1), input({ url: 'ftp://host/a.jpg' })), 'VALIDATION_ERROR');
    await expectCode(
      service.add(scoped(T1), input({ url: 'https://example.com/x.jpg', category: 'nope' })),
      'VALIDATION_ERROR',
    );
  });

  it('rejects duplicate URLs within a tenant but allows them across tenants', async () => {
    await service.add(scoped(T1), input());
    await expectCode(service.add(scoped(T1), input()), 'CONFLICT');
    expect(await service.add(scoped(T2), input())).toBeTruthy();
  });

  it('removes owned photos and rejects foreign / anonymous removals', async () => {
    const photo = await service.add(scoped(T1), input());
    await expectCode(service.remove(scoped(T2), photo.id), 'NOT_FOUND');
    expect((await service.list({ tenantId: T1 })).length).toBe(1);
    await expectCode(service.remove(undefined, photo.id), 'UNAUTHENTICATED');
    expect(await service.remove(scoped(T1), photo.id)).toBe(true);
    await expectCode(service.remove(scoped(T1), photo.id), 'NOT_FOUND');
  });
});
