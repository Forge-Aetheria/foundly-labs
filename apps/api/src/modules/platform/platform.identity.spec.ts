import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAdminIdentityClient } from './platform.identity';

const AUTH_URL = 'https://test.supabase.co/auth/v1';

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response;
}

describe('SupabaseAdminIdentityClient (019)', () => {
  const client = new SupabaseAdminIdentityClient();

  beforeEach(() => {
    process.env.SUPABASE_AUTH_URL = AUTH_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SUPABASE_AUTH_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('returns null when the service-role credential is absent', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(client.getUserStats()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('counts total and active users from the provider response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          users: [
            { email_confirmed_at: '2026-01-01T00:00:00Z', banned_until: null },
            { email_confirmed_at: null, banned_until: '2030-01-01T00:00:00Z' },
            { confirmed_at: '2026-02-01T00:00:00Z', banned_until: null },
          ],
        }),
      ),
    );
    await expect(client.getUserStats()).resolves.toEqual({ total: 3, active: 2 });
  });

  it('returns null on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, false)));
    await expect(client.getUserStats()).resolves.toBeNull();
  });

  it('returns null when the request throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    await expect(client.getUserStats()).resolves.toBeNull();
  });
});
