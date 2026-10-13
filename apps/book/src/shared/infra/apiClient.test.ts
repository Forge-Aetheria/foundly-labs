import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, mapActionError, resolveApiUrl } from './apiClient';
import type { ActionResult, ErrorCode } from './result';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function asError(result: ActionResult<unknown>): { code: ErrorCode; message: string } | null {
  return result.ok ? null : result.error;
}

describe('apiClient (feature 008 — error contract)', () => {
  const previousUrl = process.env.API_URL;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (previousUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = previousUrl;
  });

  it('resolves the API URL from the environment', () => {
    process.env.API_URL = 'http://localhost:3002';
    expect(resolveApiUrl()).toBe('http://localhost:3002');
  });

  it('fails with STATE_ERROR when API_URL is missing', async () => {
    delete process.env.API_URL;
    const result = await apiRequest('query Ping { viewer { sub } }', {});
    expect(result.ok).toBe(false);
    expect(asError(result)?.code).toBe('STATE_ERROR');
  });

  it('returns typed data on success', async () => {
    process.env.API_URL = 'http://localhost:3002';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ data: { myServices: [{ id: 's1', name: 'Corte' }] } }),
      ),
    );
    const result = await apiRequest<{ myServices: { id: string; name: string }[] }>(
      'query Q { myServices { id name } }',
      {},
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.myServices[0]?.name).toBe('Corte');
  });

  it('maps the API error envelope codes to book ErrorCode', async () => {
    process.env.API_URL = 'http://localhost:3002';
    const codes: ErrorCode[] = ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'VALIDATION_ERROR'];
    for (const code of codes) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          jsonResponse({
            data: null,
            errors: [{ message: 'nope', extensions: { code } }],
          }),
        ),
      );
      const result = await apiRequest<never>('query Q { nope }', {});
      expect(result.ok).toBe(false);
      expect(asError(result)?.code).toBe(code);
    }
  });

  it('maps network failures to STATE_ERROR (no silent success)', async () => {
    process.env.API_URL = 'http://localhost:3002';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const result = await apiRequest('query Q { nope }', {});
    expect(result.ok).toBe(false);
    expect(asError(result)?.code).toBe('STATE_ERROR');
  });

  it('mapActionError falls back to STATE_ERROR for unknown payloads', () => {
    expect(mapActionError(null)).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: 'STATE_ERROR' }),
      }),
    );
    expect(
      mapActionError({ response: { errors: [{ extensions: { code: 'FORBIDDEN' } }] } }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      }),
    );
  });
});