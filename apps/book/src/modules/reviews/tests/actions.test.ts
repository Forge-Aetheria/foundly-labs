import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddReviewDocument } from '../../../shared/api/generated';
import { submitPublicReview } from '../actions';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock('../../../shared/api/client', () => ({
  apiRequest: (...args: unknown[]) => apiMock(...args),
}));

describe('reviews actions (feature 014)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an invalid review before calling the API', async () => {
    const result = await submitPublicReview({
      tenantSlug: 'estudio-ana',
      author: 'Lucía',
      rating: 9,
      comment: 'Genial',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('rejects an empty comment', async () => {
    const result = await submitPublicReview({
      tenantSlug: 'estudio-ana',
      author: 'Lucía',
      rating: 5,
      comment: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('submits a valid review through the public API', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: { addReview: { id: 'rev-1', author: 'Lucía', rating: 5, comment: 'Genial', createdAt: '2026-10-13T10:00:00.000Z' } },
    });
    const result = await submitPublicReview({
      tenantSlug: 'estudio-ana',
      author: 'Lucía',
      rating: 5,
      comment: 'Genial',
    });
    expect(apiMock).toHaveBeenCalledWith(AddReviewDocument, {
      input: { tenantSlug: 'estudio-ana', author: 'Lucía', rating: 5, comment: 'Genial' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toMatchObject({ id: 'rev-1', rating: 5 });
  });
});
