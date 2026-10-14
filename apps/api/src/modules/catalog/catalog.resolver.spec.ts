import { describe, expect, it } from 'vitest';
import type { AuthUser } from '../auth/jwt.types';
import { SubscriptionService } from '../subscription/subscription.service';
import { createMemorySubscriptionStore } from '../subscription/subscription.test-store';
import { createMemoryCatalogStore } from './catalog.test-store';
import { CatalogService } from './catalog.service';
import { CatalogResolver } from './catalog.resolver';

function user(tenantId?: string): AuthUser {
  return { sub: 'u1', role: 'authenticated', aud: 'authenticated', exp: 1, tenantId };
}

function setup(): { resolver: CatalogResolver; service: CatalogService } {
  const service = new CatalogService(
    createMemoryCatalogStore(),
    new SubscriptionService(createMemorySubscriptionStore()),
  );
  return { resolver: new CatalogResolver(service), service };
}

const INPUT = { name: 'Corte', priceCents: 1500, durationMinutes: 30 };

describe('CatalogResolver (010-domain-mvp-module)', () => {
  it('delegates a tenant-scoped list', async () => {
    const { resolver } = setup();
    await expect(resolver.myServices(user('T1'), undefined)).resolves.toEqual([]);
  });

  it('creates and fetches under the tenant from ctx.user', async () => {
    const { resolver } = setup();
    const created = await resolver.createMyService(user('T1'), INPUT);
    expect(created.tenantId).toBe('T1');
    const fetched = await resolver.myService(user('T1'), created.id);
    expect(fetched?.name).toBe('Corte');
  });

  it('rejects an identity without a tenant scope', async () => {
    const { resolver } = setup();
    await expect(resolver.myServices(user(undefined), undefined)).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
  });

  it('runs specialist create/delete scoped to the tenant', async () => {
    const { resolver } = setup();
    const specialist = await resolver.createMySpecialist(user('T1'), { name: 'Ana' });
    expect(specialist.tenantId).toBe('T1');
    await expect(resolver.deleteMySpecialist(user('T1'), specialist.id)).resolves.toBe(true);
    await expect(resolver.mySpecialist(user('T1'), specialist.id)).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'NOT_FOUND' } }),
    );
  });
});