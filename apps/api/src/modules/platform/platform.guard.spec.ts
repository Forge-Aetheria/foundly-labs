import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createMemoryIdentityClient } from './platform.identity';
import { REQUIRED_SUPER_ADMIN_KEY, SuperAdminGuard } from './platform.guard';
import { PlatformService } from './platform.service';
import { createMemoryPlatformStore } from './platform.test-store';

interface UserLike {
  sub: string;
  role: string;
  aud: string;
  exp: number;
  email?: string | null;
  platformRole?: string;
}

function contextFor(handler: () => void, klass: new () => unknown, user?: UserLike): ExecutionContext {
  return {
    getType: () => 'graphql',
    getHandler: () => handler,
    getClass: () => klass,
    getArgs: () => [undefined, undefined, { user }, undefined],
  } as unknown as ExecutionContext;
}

function guard(): SuperAdminGuard {
  const service = new PlatformService(createMemoryPlatformStore(), createMemoryIdentityClient());
  return new SuperAdminGuard(new Reflector(), service);
}

describe('SuperAdminGuard (019-super-admin-panel)', () => {
  it('passes when no Super Admin is required', () => {
    class Stub {
      handler(): void {}
    }
    expect(guard().canActivate(contextFor(Stub.prototype.handler, Stub))).toBe(true);
  });

  it('passes for a platform-role identity', () => {
    class Stub {
      @SetMetadata(REQUIRED_SUPER_ADMIN_KEY, true)
      handler(): void {}
    }
    const ctx = contextFor(Stub.prototype.handler, Stub, { sub: 'a', role: 'authenticated', aud: 'authenticated', exp: 0, platformRole: 'super_admin' });
    expect(guard().canActivate(ctx)).toBe(true);
  });

  it('rejects a non-admin with FORBIDDEN', () => {
    class Stub {
      @SetMetadata(REQUIRED_SUPER_ADMIN_KEY, true)
      handler(): void {}
    }
    const ctx = contextFor(Stub.prototype.handler, Stub, { sub: 'u', role: 'authenticated', aud: 'authenticated', exp: 0, email: 'owner@biz.dev' });
    expect(() => guard().canActivate(ctx)).toThrowError(
      expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }),
    );
  });

  it('rejects an anonymous caller with UNAUTHENTICATED', () => {
    class Stub {
      @SetMetadata(REQUIRED_SUPER_ADMIN_KEY, true)
      handler(): void {}
    }
    expect(() => guard().canActivate(contextFor(Stub.prototype.handler, Stub))).toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
  });
});
