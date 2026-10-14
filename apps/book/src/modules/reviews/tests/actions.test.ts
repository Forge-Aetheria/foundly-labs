import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AddReviewDocument,
  DeleteReviewDocument,
  MyReviewsDocument,
  ReviewState,
  SetReviewStateDocument,
} from '../../../shared/api/generated';
import { deleteReview, listMyReviews, setReviewState, submitPublicReview } from '../actions';

const { apiMock, adminMock } = vi.hoisted(() => ({ apiMock: vi.fn(), adminMock: vi.fn() }));

vi.mock('../../../shared/api/client', () => ({
  apiRequest: (...args: unknown[]) => apiMock(...args),
}));
vi.mock('../../../shared/api/admin-request', () => ({
  apiRequestAdmin: (...args: unknown[]) => adminMock(...args),
}));

describe('reviews actions (feature 014 submission + 015/016 moderation)', () => {
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

  it('submits a valid review and maps its pending state', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: {
        addReview: {
          id: 'rev-1',
          author: 'Lucía',
          rating: 5,
          comment: 'Genial',
          state: ReviewState.Pending,
          createdAt: '2026-10-13T10:00:00.000Z',
        },
      },
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
    if (result.ok) expect(result.data).toMatchObject({ id: 'rev-1', rating: 5, state: 'pending' });
  });

  it('lists the tenant reviews through the session-aware transport and maps states', async () => {
    adminMock.mockResolvedValue({
      ok: true,
      data: {
        myReviews: [
          { id: 'r1', author: 'Ana', rating: 5, comment: 'Genial', state: ReviewState.Pending, createdAt: '2026-10-13T10:00:00.000Z' },
          { id: 'r2', author: 'Luis', rating: 4, comment: 'Bien', state: ReviewState.Approved, createdAt: '2026-10-12T10:00:00.000Z' },
        ],
      },
    });

    const result = await listMyReviews('pending');
    expect(adminMock).toHaveBeenCalledWith(MyReviewsDocument, { state: ReviewState.Pending });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.map((review) => review.state)).toEqual(['pending', 'approved']);
    }
  });

  it('rejects a pending moderation target before calling the API', async () => {
    const result = await setReviewState({ id: 'r1', state: 'pending' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(adminMock).not.toHaveBeenCalled();
  });

  it('approves a review through the API', async () => {
    adminMock.mockResolvedValue({
      ok: true,
      data: {
        setReviewState: {
          id: 'r1',
          author: 'Ana',
          rating: 5,
          comment: 'Genial',
          state: ReviewState.Approved,
          createdAt: '2026-10-13T10:00:00.000Z',
        },
      },
    });
    const result = await setReviewState({ id: 'r1', state: 'approved' });
    expect(adminMock).toHaveBeenCalledWith(SetReviewStateDocument, {
      id: 'r1',
      state: ReviewState.Approved,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.state).toBe('approved');
  });

  it('deletes a review through the API', async () => {
    adminMock.mockResolvedValue({ ok: true, data: { deleteReview: true } });
    const result = await deleteReview({ id: 'r1' });
    expect(adminMock).toHaveBeenCalledWith(DeleteReviewDocument, { id: 'r1' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 'r1' });
  });
});
