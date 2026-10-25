import {
  DeleteReviewDocument,
  MyReviewsDocument,
  SetReviewStateDocument,
  type DeleteReviewMutation,
  type MyReviewsQuery,
  type ReviewState,
  type SetReviewStateMutation,
} from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, ok, type ActionResult } from '@/shared/api/result';
import type { Review } from './review-utils';

export async function fetchReviews(): Promise<ActionResult<Review[]>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<MyReviewsQuery>(MyReviewsDocument, { state: null }, { token });
  return result.ok ? ok(result.data.myReviews) : result;
}

export async function setReviewState(
  id: string,
  state: ReviewState,
): Promise<ActionResult<Review>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<SetReviewStateMutation>(
    SetReviewStateDocument,
    { id, state },
    { token },
  );
  return result.ok ? ok(result.data.setReviewState) : result;
}

export async function deleteReview(id: string): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<DeleteReviewMutation>(DeleteReviewDocument, { id }, { token });
  return result.ok ? ok(true) : result;
}
