import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AddGalleryItemDocument,
  GalleryDocument,
  RemoveGalleryItemDocument,
} from '../../../shared/api/generated';
import { addGalleryItem, listGallery, removeGalleryItem } from '../actions';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock('../../../shared/api/admin-request', () => ({
  apiRequestAdmin: (...args: unknown[]) => apiMock(...args),
}));

describe('gallery actions (feature 013 — server-only via apiRequestAdmin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists the tenant gallery through the session-aware transport and maps categories', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: {
        gallery: [
          { id: 'g1', url: 'https://example.com/1.jpg', title: 'Fachada', description: null, category: 'local', order: 0 },
          { id: 'g2', url: 'https://example.com/2.jpg', title: null, description: null, category: 'raro', order: 1 },
        ],
      },
    });

    const result = await listGallery('ten-ana');
    expect(apiMock).toHaveBeenCalledWith(GalleryDocument, { tenantId: 'ten-ana', tenantSlug: null });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: 'g1', url: 'https://example.com/1.jpg', category: 'local' });
      // Unknown category is dropped, not surfaced as garbage.
      expect(result.data[1]?.category).toBeUndefined();
    }
  });

  it('rejects an invalid photo input before calling the API', async () => {
    const result = await addGalleryItem({ url: 'not-a-url' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('adds a photo through the API and maps the result', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: { addGalleryItem: { id: 'g9', url: 'https://example.com/9.jpg', title: 'Nueva', description: null, category: 'equipo', order: 3 } },
    });

    const result = await addGalleryItem({ url: 'https://example.com/9.jpg', title: 'Nueva', category: 'equipo' });
    expect(apiMock).toHaveBeenCalledWith(AddGalleryItemDocument, {
      input: { url: 'https://example.com/9.jpg', title: 'Nueva', description: null, category: 'equipo' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toMatchObject({ id: 'g9', category: 'equipo' });
  });

  it('removes a photo through the API', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { removeGalleryItem: true } });
    const result = await removeGalleryItem({ id: 'g1' });
    expect(apiMock).toHaveBeenCalledWith(RemoveGalleryItemDocument, { id: 'g1' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 'g1' });
  });

  it('routes session errors through the session-aware transport (no raw text handling)', async () => {
    apiMock.mockResolvedValue({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'x' } });
    const result = await listGallery('ten-ana');
    // The action delegates session handling to `apiRequestAdmin` and returns the typed error unchanged.
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });
});
