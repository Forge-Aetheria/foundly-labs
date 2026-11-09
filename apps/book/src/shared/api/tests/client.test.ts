import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, mapActionError, resolveApiUrl } from '../client';
import { onUnauthenticated } from '../notify-unauthenticated';
import { MyServicesDocument } from '../generated';
import type { ActionResult, ErrorCode } from '../../types/result';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function asError(result: ActionResult<unknown>): { code: ErrorCode; message: string } | null {
  return result.ok ? null : result.error;
}

describe('apiClient (feature 008/011/024 — browser transport)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('resolves the API URL from VITE_API_URL', () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3002');
    expect(resolveApiUrl()).toBe('http://localhost:3002');
  });

  it('fails with STATE_ERROR when VITE_API_URL is missing', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const result = await apiRequest(MyServicesDocument, { active: null });
    expect(result.ok).toBe(false);
    expect(asError(result)?.code).toBe('STATE_ERROR');
  });

  it('returns typed data on success', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3002');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ data: { myServices: [{ id: 's1', name: 'Corte' }] } })),
    );
    const result = await apiRequest(MyServicesDocument, { active: null });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.myServices[0]?.name).toBe('Corte');
  });

  it('maps the API error envelope codes to book ErrorCode', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3002');
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
      const result = await apiRequest(MyServicesDocument, { active: null });
      expect(result.ok).toBe(false);
      expect(asError(result)?.code).toBe(code);
    }
  });

  it('emits the global unauthenticated signal on UNAUTHENTICATED', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3002');
    const listener = vi.fn();
    const unsubscribe = onUnauthenticated(listener);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ data: null, errors: [{ extensions: { code: 'UNAUTHENTICATED' } }] }),
      ),
    );
    await apiRequest(MyServicesDocument, { active: null });
    unsubscribe();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('maps network failures to STATE_ERROR (no silent success)', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3002');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const result = await apiRequest(MyServicesDocument, { active: null });
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
