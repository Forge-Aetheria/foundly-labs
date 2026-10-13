import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBusiness, validateSlug } from '../utils/actions';
import type { BookingDraft } from '../../../shared/types/tenancy';

const { provisionMock, fetchTenantBySlugMock } = vi.hoisted(() => ({
  provisionMock: vi.fn(),
  fetchTenantBySlugMock: vi.fn(),
}));

vi.mock('../utils/server', () => ({
  provisionOnboardingRemote: (...args: unknown[]) => provisionMock(...args),
}));

vi.mock('../../../shared/infra/remoteTenancy', () => ({
  fetchTenantBySlug: (...args: unknown[]) => fetchTenantBySlugMock(...args),
}));

const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
  weekday === 0
    ? { weekday, isOpen: false, startTime: '', endTime: '' }
    : { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' },
);

const input = {
  draftId: 'draft-new-1',
  account: { fullName: 'Raúl Gómez', email: 'raul@nuevo.dev', password: 'secreto123' },
  business: { name: 'Estudio Nuevo', slug: 'estudio-nuevo', category: 'Estética' },
  setup: { defaultAppointmentDurationMinutes: 45, businessHours: hours },
};

describe('onboarding actions (contracts/onboarding.contract.md — server-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    provisionMock.mockResolvedValue({
      ok: true,
      data: { tenantId: 'ten-remote', redirectTo: '/admin/agenda' },
    });
    fetchTenantBySlugMock.mockResolvedValue({ ok: true, data: null });
  });

  it('delegates provisioning to the remote provider (no local fallback)', async () => {
    const result = await createBusiness(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.redirectTo).toBe('/admin/agenda');
    expect(provisionMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces a remote EMAIL_TAKEN failure without inventing a local account', async () => {
    provisionMock.mockResolvedValue({
      ok: false,
      error: {
        code: 'EMAIL_TAKEN',
        message: 'Ese email ya está registrado.',
        fields: { email: 'El email ya está en uso.' },
      },
    });
    const result = await createBusiness({
      ...input,
      draftId: 'd-email',
      account: { ...input.account, email: 'ana@foundly.dev' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects an invalid draft shape with VALIDATION_ERROR before hitting remote', async () => {
    const result = await createBusiness({
      ...input,
      setup: { ...input.setup, defaultAppointmentDurationMinutes: 0 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(provisionMock).not.toHaveBeenCalled();
  });

  it('reports slug availability against the backend (no store)', async () => {
    await expect(validateSlug('estudio-nuevo')).resolves.toEqual({ available: true });

    fetchTenantBySlugMock.mockResolvedValue({
      ok: true,
      data: { id: 'ten-ana', name: 'Estudio Ana', category: 'Peluquería', status: 'active' },
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

  it('keeps BookingDraft structurally compatible', () => {
    const draft: BookingDraft = {
      draftId: input.draftId,
      step: 3,
      account: input.account,
      business: input.business,
      setup: input.setup,
    };
    expect(draft.step).toBe(3);
  });
});