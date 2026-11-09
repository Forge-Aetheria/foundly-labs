import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterBusinessDocument, TenantBySlugDocument } from '../../../shared/api/generated';

const { apiMock, supabaseMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  supabaseMock: { auth: { signInWithPassword: vi.fn() } },
}));

vi.mock('../../../shared/api/client', () => ({
  apiRequest: (...args: unknown[]) => apiMock(...args),
}));
vi.mock('../../../shared/auth/supabase', () => ({
  createBrowserSupabaseClient: () => supabaseMock,
}));

import { createBusiness, validateSlug } from '../services';

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

describe('onboarding services (feature 024 — SPA + API binding)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.mockResolvedValue({ ok: true, data: { tenant: null } });
    supabaseMock.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
  });

  it('reports slug availability against the API (format/reserved local)', async () => {
    await expect(validateSlug('estudio-nuevo')).resolves.toEqual({ available: true });

    apiMock.mockResolvedValueOnce({ ok: true, data: { tenant: { id: 'ten-ana' } } });
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

  it('registers through the API and signs the owner in', async () => {
    apiMock.mockResolvedValueOnce({
      ok: true,
      data: { registerBusiness: { tenantId: 'ten-new' } },
    });
    const result = await createBusiness(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.tenantId).toBe('ten-new');
      expect(result.data.redirectTo).toBe('/admin/agenda');
    }
    expect(apiMock).toHaveBeenCalledWith(RegisterBusinessDocument, {
      input: {
        account: {
          fullName: 'Raúl Gómez',
          email: 'raul@nuevo.dev',
          password: 'secreto123',
        },
        business: {
          name: 'Estudio Nuevo',
          category: 'SALUD_BIENESTAR',
          slug: 'estudio-nuevo',
        },
      },
    });
    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'raul@nuevo.dev',
      password: 'secreto123',
    });
  });

  it('surfaces an API failure without signing in', async () => {
    apiMock.mockResolvedValueOnce({
      ok: false,
      error: { code: 'EMAIL_TAKEN', message: 'Ese email ya está registrado.' },
    });
    const result = await createBusiness(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('EMAIL_TAKEN');
    expect(supabaseMock.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});
