import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthUser } from '../auth/jwt.types';
import { createMemoryGalleryStore, type MemoryGalleryStore } from './gallery.test-store';
import { GalleryService } from './gallery.service';
import { GalleryResolver } from './gallery.resolver';

function user(tenantId?: string): AuthUser {
  return { sub: 'u1', role: 'authenticated', aud: 'authenticated', exp: 1, tenantId };
}

const INPUT = { url: 'https://example.com/a.jpg', title: 'Foto' };

describe('GalleryResolver (012-gallery-management)', () => {
  let store: MemoryGalleryStore;
  let resolver: GalleryResolver;

  beforeEach(() => {
    store = createMemoryGalleryStore();
    resolver = new GalleryResolver(new GalleryService(store));
  });

  it('reads a public gallery scoped by slug', async () => {
    store.tenantBySlug('estudio-ana', 'T1');
    await expect(resolver.gallery(null, 'estudio-ana')).resolves.toEqual([]);
  });

  it('adds under the tenant from ctx.user and reads it back', async () => {
    const created = await resolver.addGalleryItem(user('T1'), INPUT);
    expect(created.order).toBe(0);
    expect(created.title).toBe('Foto');
    const list = await resolver.gallery('T1', null);
    expect(list.map((row) => row.id)).toEqual([created.id]);
  });

  it('rejects an identity without a tenant scope', async () => {
    await expect(resolver.addGalleryItem(user(undefined), INPUT)).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
  });

  it('removes an owned photo and rejects a foreign id', async () => {
    const created = await resolver.addGalleryItem(user('T1'), INPUT);
    await expect(resolver.removeGalleryItem(user('T2'), created.id)).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'NOT_FOUND' } }),
    );
    await expect(resolver.removeGalleryItem(user('T1'), created.id)).resolves.toBe(true);
  });
});
