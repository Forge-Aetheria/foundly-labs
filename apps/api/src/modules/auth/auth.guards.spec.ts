import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import type { AuthContext } from './auth.context';
import { GqlAuthGuard, PlanGuard, REQUIRED_PLANS_KEY } from './auth.guards';
import type { AuthService } from './auth.service';

interface AuthRequestLike {
  headers: { authorization?: string };
  authContext?: AuthContext;
}

function makeContext(req: AuthRequestLike): ExecutionContext {
  class Stub {
    handler(): void {}
  }
  return {
    getType: () => 'graphql',
    getHandler: () => Stub.prototype.handler,
    getClass: () => Stub,
    getArgs: () => [undefined, undefined, { req }, undefined],
  } as unknown as ExecutionContext;
}

const activeTenant = { id: 't1', status: 'active', plan: 'book' };

describe('GqlAuthGuard (unit, 006-foundly-pass-auth)', () => {
  let fakeAuth: { verifySession: ReturnType<typeof vi.fn> };
  let fakePrisma: {
    client: {
      tenant: { findUnique: ReturnType<typeof vi.fn> };
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fakeAuth = { verifySession: vi.fn() };
    fakePrisma = {
      client: {
        tenant: {
          findUnique: vi.fn(async () => activeTenant),
        },
      },
    };
  });

  async function guard(): Promise<GqlAuthGuard> {
    return new GqlAuthGuard(
      fakeAuth as unknown as AuthService,
      fakePrisma as unknown as PrismaService,
    );
  }

  it('allows an active tenant and attaches the AuthContext', async () => {
    const req: AuthRequestLike = { headers: { authorization: 'Bearer abc.def' } };
    fakeAuth.verifySession.mockReturnValue({
      userId: 'u1',
      tenantId: 't1',
      role: 'owner',
    });
    const can = await (await guard()).canActivate(makeContext(req));
    expect(can).toBe(true);
    expect(req.authContext).toEqual({
      userId: 'u1',
      tenantId: 't1',
      role: 'owner',
      tenant: activeTenant,
    });
  });

  it('rejects a missing bearer header with UNAUTHENTICATED', async () => {
    const req: AuthRequestLike = { headers: {} };
    await expect((await guard()).canActivate(makeContext(req))).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
    expect(fakeAuth.verifySession).not.toHaveBeenCalled();
  });

  it('rejects an invalid token with UNAUTHENTICATED', async () => {
    const req: AuthRequestLike = { headers: { authorization: 'Bearer nope' } };
    fakeAuth.verifySession.mockImplementation(() => {
      throw new GraphQLError('Unauthenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    });
    await expect((await guard()).canActivate(makeContext(req))).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
  });

  it('rejects a non-active tenant with FORBIDDEN', async () => {
    const req: AuthRequestLike = { headers: { authorization: 'Bearer abc.def' } };
    fakeAuth.verifySession.mockReturnValue({
      userId: 'u1',
      tenantId: 't2',
      role: 'owner',
    });
    fakePrisma.client.tenant.findUnique.mockResolvedValue({
      id: 't2',
      status: 'suspended',
      plan: null,
    });
    await expect((await guard()).canActivate(makeContext(req))).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }),
    );
  });

  it('rejects an unknown tenant with FORBIDDEN', async () => {
    const req: AuthRequestLike = { headers: { authorization: 'Bearer abc.def' } };
    fakeAuth.verifySession.mockReturnValue({
      userId: 'u1',
      tenantId: 'missing',
      role: 'owner',
    });
    fakePrisma.client.tenant.findUnique.mockResolvedValue(null);
    await expect((await guard()).canActivate(makeContext(req))).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }),
    );
  });
});

describe('PlanGuard (unit, 006-foundly-pass-auth)', () => {
  function planGuard(): PlanGuard {
    return new PlanGuard(new Reflector());
  }

  it('passes when the required plan matches the tenant plan', () => {
    class Stub {
      @SetMetadata(REQUIRED_PLANS_KEY, ['book'])
      handler(): void {}
    }
    const req: AuthRequestLike = {
      headers: { authorization: 'Bearer x' },
      authContext: {
        userId: 'u1',
        tenantId: 't1',
        role: 'owner',
        tenant: { id: 't1', status: 'active', plan: 'book' },
      },
    };
    const ctx = {
      getType: () => 'graphql',
      getHandler: () => Stub.prototype.handler,
      getClass: () => Stub,
      getArgs: () => [undefined, undefined, { req }, undefined],
    } as unknown as ExecutionContext;
    expect(planGuard().canActivate(ctx)).toBe(true);
  });

  it('rejects when the required plan is not active', () => {
    class Stub {
      @SetMetadata(REQUIRED_PLANS_KEY, ['book'])
      handler(): void {}
    }
    const req: AuthRequestLike = {
      headers: { authorization: 'Bearer x' },
      authContext: {
        userId: 'u1',
        tenantId: 't3',
        role: 'owner',
        tenant: { id: 't3', status: 'active', plan: null },
      },
    };
    const ctx = {
      getType: () => 'graphql',
      getHandler: () => Stub.prototype.handler,
      getClass: () => Stub,
      getArgs: () => [undefined, undefined, { req }, undefined],
    } as unknown as ExecutionContext;
    expect(() => planGuard().canActivate(ctx)).toThrowError(
      expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }),
    );
  });

  it('passes when no plan is required', () => {
    class Stub {
      handler(): void {}
    }
    const req: AuthRequestLike = { headers: {} };
    const ctx = {
      getType: () => 'graphql',
      getHandler: () => Stub.prototype.handler,
      getClass: () => Stub,
      getArgs: () => [undefined, undefined, { req }, undefined],
    } as unknown as ExecutionContext;
    expect(planGuard().canActivate(ctx)).toBe(true);
  });
});
