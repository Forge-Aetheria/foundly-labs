import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantsDocument, UpdateBusinessProfileDocument } from '../../../shared/api/generated';
import { getProfile, updateProfile } from '../actions';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock('../../../shared/api/admin-request', () => ({
  apiRequestAdmin: (...args: unknown[]) => apiMock(...args),
}));

function tenantDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ten-ana',
    name: 'Estudio Ana',
    category: 'Peluquería',
    status: 'active',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    profile: {
      slug: 'estudio-ana',
      bio: 'Bio',
      address: 'Calle Mayor 7',
      phone: '+34 612 345 678',
      instagram: 'https://instagram.com/estudioana',
      whatsapp: null,
      logo: null,
      cover: null,
      policies: [{ title: 'Cancelación', body: 'Avisa con 24 h.' }],
    },
    services: [],
    ...overrides,
  };
}

describe('profile actions (feature 014)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the tenant profile and maps structured policies', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { tenants: [tenantDto()] } });
    const result = await getProfile('ten-ana');
    expect(apiMock).toHaveBeenCalledWith(TenantsDocument, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Estudio Ana');
      expect(result.data.social).toEqual({ instagram: 'https://instagram.com/estudioana', whatsapp: undefined });
      expect(result.data.policies).toEqual([
        { id: 'policy-0', tenantId: 'ten-ana', title: 'Cancelación', body: 'Avisa con 24 h.' },
      ]);
    }
  });

  it('returns NOT_FOUND when the tenant is missing', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { tenants: [] } });
    const result = await getProfile('nope');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects an invalid URL before calling the API', async () => {
    const result = await updateProfile({
      name: 'Estudio Ana',
      category: 'Peluquería',
      slug: 'estudio-ana',
      instagram: 'not-a-url',
      policies: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('sends the edited profile and maps the result', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: { updateMyBusinessProfile: tenantDto({ name: 'Estudio Ana Nuevo' }) },
    });
    const result = await updateProfile({
      name: 'Estudio Ana Nuevo',
      category: 'Peluquería',
      slug: 'estudio-ana',
      bio: 'Nueva bio',
      address: '',
      phone: '',
      instagram: null,
      whatsapp: null,
      logo: null,
      cover: null,
      policies: [{ title: 'Depósito', body: '20%' }],
    });
    expect(apiMock).toHaveBeenCalledWith(UpdateBusinessProfileDocument, {
      input: {
        name: 'Estudio Ana Nuevo',
        category: 'Peluquería',
        slug: 'estudio-ana',
        bio: 'Nueva bio',
        address: '',
        phone: '',
        instagram: null,
        whatsapp: null,
        logo: null,
        cover: null,
        policies: [{ title: 'Depósito', body: '20%' }],
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe('Estudio Ana Nuevo');
  });

  it('maps a CONFLICT to an inline slug field error', async () => {
    apiMock.mockResolvedValue({ ok: false, error: { code: 'CONFLICT', message: 'taken' } });
    const result = await updateProfile({
      name: 'X',
      category: 'Y',
      slug: 'estudio-ana',
      policies: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONFLICT');
      expect(result.error.fields?.slug).toBeTruthy();
    }
  });
});
