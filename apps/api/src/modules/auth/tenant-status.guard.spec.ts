import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import type { AuthUser } from './jwt.types';
import { TenantStatusCache } from './tenant-status.cache';
import { TenantStatusGuard } from './tenant-status.guard';

interface GuardContextLike {
  user?: AuthUser;
}

function makeContext(gqlContext: GuardContextLike): ExecutionContext {
  class Stub {
    handler(): void {}
  }
  return {
    getType: () => 'graphql',
    getHandler: () => Stub.prototype.handler,
    getClass: () => Stub,
    getArgs: () => [undefined, undefined, gqlContext, undefined],
  } as unknown as ExecutionContext;
}

const user: AuthUser = {
  sub: 'user-1',
  role: 'authenticated',
  aud: 'authenticated',
  exp: 9999999999,
  tenantId: 'tenant-1',
};

describe('TenantStatusGuard', () => {
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let findUnique: ReturnType<typeof vi.fn>;
  let cache: TenantStatusCache;

  beforeEach(() => {
    vi.clearAllMocks();
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    findUnique = vi.fn();
    cache = new TenantStatusCache();
  });

  function guard(): TenantStatusGuard {
    return new TenantStatusGuard(
      reflector as unknown as Reflector,
      { client: { tenant: { findUnique } } } as unknown as PrismaService,
      cache,
    );
  }

  it('allows an active tenant and caches the status', async () => {
    findUnique.mockResolvedValue({ status: 'active' });
    const context = makeContext({ user });

    await expect(guard().canActivate(context)).resolves.toBe(true);
    await expect(guard().canActivate(context)).resolves.toBe(true);

    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it('rejects a suspended tenant with FORBIDDEN', async () => {
    findUnique.mockResolvedValue({ status: 'suspended' });

    await expect(guard().canActivate(makeContext({ user }))).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    });
  });

  it('rejects a missing tenant with FORBIDDEN', async () => {
    findUnique.mockResolvedValue(null);

    await expect(guard().canActivate(makeContext({ user }))).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    });
  });

  it('does not query when the identity has no tenant', async () => {
    const noTenantUser = { ...user, tenantId: undefined };
    await expect(guard().canActivate(makeContext({ user: noTenantUser }))).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('does not query when the operation is explicitly allowed', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard().canActivate(makeContext({ user }))).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('re-queries after the cache expires', async () => {
    const shortCache = new TenantStatusCache();
    shortCache.setTtl(0);
    findUnique.mockResolvedValue({ status: 'active' });
    const statusGuard = new TenantStatusGuard(
      reflector as unknown as Reflector,
      { client: { tenant: { findUnique } } } as unknown as PrismaService,
      shortCache,
    );
    const context = makeContext({ user });

    await statusGuard.canActivate(context);
    await statusGuard.canActivate(context);

    expect(findUnique).toHaveBeenCalledTimes(2);
  });
});
