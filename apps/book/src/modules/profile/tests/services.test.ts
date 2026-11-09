import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyBusinessDocument, UpdateBusinessProfileDocument } from '../../../shared/api/generated';
import { getProfile, updateProfile } from '../services';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock('../../../shared/api/authed-request', () => ({
  apiRequestAuthed: (...args: unknown[]) => apiMock(...args),
}));

function tenantDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ten-ana',
    name: 'Estudio Ana',
    category: 'BARBERIAS_PELUQUERIAS',
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
    apiMock.mockResolvedValue({ ok: true, data: { myBusiness: tenantDto() } });
    const result = await getProfile();
    expect(apiMock).toHaveBeenCalledWith(MyBusinessDocument, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Estudio Ana');
      expect(result.data.social).toEqual({
        instagram: 'https://instagram.com/estudioana',
        whatsapp: undefined,
      });
      expect(result.data.policies).toEqual([
        { id: 'policy-0', tenantId: 'ten-ana', title: 'Cancelación', body: 'Avisa con 24 h.' },
      ]);
    }
  });

  it('surfaces the API error when the business is not operable', async () => {
    apiMock.mockResolvedValue({
      ok: false,
      error: { code: 'FORBIDDEN', message: 'Tenant is not active' },
    });
    const result = await getProfile();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
  });

  it('rejects an invalid URL before calling the API', async () => {
    const result = await updateProfile({
      name: 'Estudio Ana',
      category: 'BARBERIAS_PELUQUERIAS',
      slug: 'estudio-ana',
      isPublic: true,
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
      category: 'BARBERIAS_PELUQUERIAS',
      slug: 'estudio-ana',
      bio: 'Nueva bio',
      address: '',
      phone: '',
      instagram: null,
      whatsapp: null,
      logo: null,
      cover: null,
      isPublic: true,
      policies: [{ title: 'Depósito', body: '20%' }],
    });
    expect(apiMock).toHaveBeenCalledWith(UpdateBusinessProfileDocument, {
      input: {
        name: 'Estudio Ana Nuevo',
        category: 'BARBERIAS_PELUQUERIAS',
        slug: 'estudio-ana',
        bio: 'Nueva bio',
        address: '',
        phone: '',
        instagram: null,
        whatsapp: null,
        logo: null,
        cover: null,
        isPublic: true,
        tags: [],
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
      category: 'BARBERIAS_PELUQUERIAS',
      slug: 'estudio-ana',
      isPublic: true,
      policies: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONFLICT');
      expect(result.error.fields?.slug).toBeTruthy();
    }
  });
});
