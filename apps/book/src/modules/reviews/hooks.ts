'use client';

import type { ActionResult } from '../../shared/types/result';
import type { Review, ReviewState } from '../../shared/types/tenancy';
import { deleteReview, listMyReviews, setReviewState, submitPublicReview } from './actions';

/**
 * Reviews client hooks (014 submission; 015/016 moderation; constitution §5.VI).
 */
export function useSubmitReview(): (input: unknown) => Promise<ActionResult<Review>> {
  return (input) => submitPublicReview(input);
}

export function useFetchMyReviews(): (state?: ReviewState) => Promise<ActionResult<Review[]>> {
  return (state) => listMyReviews(state);
}

export function useSetReviewState(): (input: unknown) => Promise<ActionResult<Review>> {
  return (input) => setReviewState(input);
}

export function useDeleteReview(): (input: unknown) => Promise<ActionResult<{ id: string }>> {
  return (input) => deleteReview(input);
}
