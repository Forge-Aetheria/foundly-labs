import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBusinessesDocument } from '../../../shared/api/generated';
import { getDirectoryBusinesses } from '../actions';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock('../../../shared/api/client', () => ({ apiRequest: (...args: unknown[]) => apiMock(...args) }));

function makeBusiness(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 't1',
    slug: 'estudio-ana',
    name: 'Estudio Ana',
    category: 'Peluquería',
    description: 'Estudio de referencia.',
    address: 'Calle Mayor 7, Madrid',
    phone: '+34 612 345 678',
    logo: 'https://cdn/logo.png',
    cover: null,
    schedule: [
      { weekday: 1, startTime: '09:00', endTime: '18:00' },
      { weekday: 2, startTime: '09:00', endTime: '18:00' },
    ],
    ...overrides,
  };
}

describe('getDirectoryBusinesses (019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps API rows to directory businesses (null-safe)', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { searchBusinesses: [makeBusiness()] } });
    const result = await getDirectoryBusinesses('madrid');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([
      {
        tenantId: 't1',
        slug: 'estudio-ana',
        name: 'Estudio Ana',
        category: 'Peluquería',
        description: 'Estudio de referencia.',
        address: 'Calle Mayor 7, Madrid',
        logo: 'https://cdn/logo.png',
        cover: null,
        hours: [
          { weekday: 1, startTime: '09:00', endTime: '18:00' },
          { weekday: 2, startTime: '09:00', endTime: '18:00' },
        ],
      },
    ]);
    expect(apiMock).toHaveBeenCalledWith(
      SearchBusinessesDocument,
      expect.objectContaining({ query: 'madrid' }),
    );
  });

  it('sends null for an empty/whitespace term', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { searchBusinesses: [] } });
    await getDirectoryBusinesses('   ');
    expect(apiMock).toHaveBeenCalledWith(
      SearchBusinessesDocument,
      expect.objectContaining({ query: null }),
    );
  });

  it('returns the failure unchanged when the API read fails', async () => {
    apiMock.mockResolvedValue({ ok: false, error: { code: 'STATE_ERROR', message: 'down' } });
    const result = await getDirectoryBusinesses('x');
    expect(result).toEqual({ ok: false, error: { code: 'STATE_ERROR', message: 'down' } });
  });
});
