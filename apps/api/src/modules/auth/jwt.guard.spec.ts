import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseJwtGuard } from './jwt.guard';
import type { SupabaseJwtService } from './jwt.service';
import type { AuthUser } from './jwt.types';

const user: AuthUser = {
  sub: 'user-123',
  email: 'user@foundly.dev',
  role: 'authenticated',
  aud: 'authenticated',
  exp: 9999999999,
};

interface GuardContextLike {
  req?: { headers?: { authorization?: string } };
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

function expectUnauth(guard: SupabaseJwtGuard, gqlContext: GuardContextLike): Promise<void> {
  return expect(guard.canActivate(makeContext(gqlContext))).rejects.toThrowError(
    expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
  );
}

describe('SupabaseJwtGuard (unit, 008-supabase-jwt-auth)', () => {
  let fakeService: { verify: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    fakeService = { verify: vi.fn() };
  });

  function guard(): SupabaseJwtGuard {
    return new SupabaseJwtGuard(fakeService as unknown as SupabaseJwtService);
  }

  it('verifies a bearer token and attaches ctx.user', async () => {
    fakeService.verify.mockResolvedValue(user);
    const gqlContext: GuardContextLike = {
      req: { headers: { authorization: 'Bearer a.b.c' } },
    };
    const can = await guard().canActivate(makeContext(gqlContext));
    expect(can).toBe(true);
    expect(gqlContext.user).toEqual(user);
    expect(fakeService.verify).toHaveBeenCalledWith('a.b.c');
  });

  it('rejects a missing authorization header with UNAUTHENTICATED', async () => {
    await expectUnauth(guard(), { req: { headers: {} } });
    expect(fakeService.verify).not.toHaveBeenCalled();
  });

  it('rejects a malformed (non-bearer) header with UNAUTHENTICATED', async () => {
    await expectUnauth(guard(), {
      req: { headers: { authorization: 'Basic dXNlcnBAZnZpcg==' } },
    });
    expect(fakeService.verify).not.toHaveBeenCalled();
  });

  it('rejects an empty bearer token with UNAUTHENTICATED', async () => {
    await expectUnauth(guard(), {
      req: { headers: { authorization: 'Bearer   ' } },
    });
    expect(fakeService.verify).not.toHaveBeenCalled();
  });

  it('propagates UNAUTHENTICATED from verification and leaves ctx.user unset', async () => {
    const rejected = new Error('expired') as Error & { extensions?: { code: string } };
    rejected.extensions = { code: 'UNAUTHENTICATED' };
    fakeService.verify.mockRejectedValue(rejected);
    const gqlContext: GuardContextLike = {
      req: { headers: { authorization: 'Bearer old.token' } },
    };
    await expect(
      guard().canActivate(makeContext(gqlContext)),
    ).rejects.toThrowError(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
    );
    expect(gqlContext.user).toBeUndefined();
  });
});