import { ReviewState } from '@/shared/api/generated';
import {
  REVIEW_STATE_LABELS,
  canApprove,
  canReject,
  filterReviews,
  formatReviewDate,
  reviewRatingLabel,
  type Review,
} from '../review-utils';

const reviews: Review[] = [
  {
    id: 'r1',
    author: 'Ana',
    rating: 5,
    comment: 'Excelente',
    state: ReviewState.Approved,
    createdAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'r2',
    author: 'Luis',
    rating: 3,
    comment: 'Correcto',
    state: ReviewState.Pending,
    createdAt: '2026-10-21T10:00:00Z',
  },
];

describe('review utils', () => {
  it('filters by moderation state', () => {
    expect(filterReviews(reviews, 'all')).toHaveLength(2);
    expect(filterReviews(reviews, ReviewState.Pending).map((r) => r.id)).toEqual(['r2']);
    expect(filterReviews(reviews, ReviewState.Rejected)).toEqual([]);
  });

  it('guards moderation transitions', () => {
    expect(canApprove(ReviewState.Pending)).toBe(true);
    expect(canApprove(ReviewState.Approved)).toBe(false);
    expect(canReject(ReviewState.Rejected)).toBe(false);
  });

  it('formats labels, dates and ratings', () => {
    expect(REVIEW_STATE_LABELS[ReviewState.Approved]).toBe('Aprobada');
    expect(reviewRatingLabel(4)).toBe('4★');
    expect(formatReviewDate('invalid')).toBe('invalid');
    expect(formatReviewDate('2026-10-20T10:00:00Z')).toContain('2026');
  });
});
