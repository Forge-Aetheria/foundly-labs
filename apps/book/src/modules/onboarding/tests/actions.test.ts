import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantBySlugDocument } from '../../../shared/api/generated';
import { createBusiness, validateSlug } from '../actions';

const { apiMock, envMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  envMock: { liveAuthEnv: vi.fn(), supabaseAdminEnv: vi.fn() },
}));

vi.mock('../../../shared/api/client', () => ({
  apiRequest: (...args: unknown[]) => apiMock(...args),
}));
vi.mock('../../../shared/auth/supabase/env', () => ({
  liveAuthEnv: (...args: unknown[]) => envMock.liveAuthEnv(...args),
  supabaseAdminEnv: (...args: unknown[]) => envMock.supabaseAdminEnv(...args),
}));

const input = {
  draftId: 'draft-1',
  account: { fullName: 'Raúl Gómez', email: 'raul@nuevo.dev', password: 'secreto123' },
  business: { name: 'Estudio Nuevo', slug: 'estudio-nuevo', category: 'SALUD_BIENESTAR' },
  setup: {
    defaultAppointmentDurationMinutes: 45,
    businessHours: [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
      weekday === 0
        ? { weekday, isOpen: false, startTime: '', endTime: '' }
        : { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' },
    ),
  },
};

describe('onboarding actions (feature 011 — server-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.mockResolvedValue({ ok: true, data: { tenant: null } });
    envMock.liveAuthEnv.mockReturnValue(null);
    envMock.supabaseAdminEnv.mockReturnValue(null);
  });

  it('reports slug availability against the API (format/reserved local)', async () => {
    await expect(validateSlug('estudio-nuevo')).resolves.toEqual({ available: true });

    apiMock.mockResolvedValueOnce({
      ok: true,
      data: { tenant: { id: 'ten-ana' } },
    });
    await expect(validateSlug('estudio-ana')).resolves.toEqual({
      available: false,
      reason: 'taken',
    });

    await expect(validateSlug('admin')).resolves.toEqual({ available: false, reason: 'reserved' });
    await expect(validateSlug('Mi Negocio')).resolves.toEqual({
      available: false,
      reason: 'format',
    });
  });

  it('queries uniqueness through the generated TenantBySlug document', async () => {
    await validateSlug('estudio-nuevo');
    expect(apiMock).toHaveBeenCalledWith(TenantBySlugDocument, { slug: 'estudio-nuevo' });
  });

  it('rejects an invalid draft shape with VALIDATION_ERROR', async () => {
    const result = await createBusiness({
      ...input,
      setup: { ...input.setup, defaultAppointmentDurationMinutes: 0 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('fails visibly when remote auth is not configured (no local fallback)', async () => {
    const result = await createBusiness(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('STATE_ERROR');
  });
});
