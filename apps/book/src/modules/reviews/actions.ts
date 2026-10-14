'use server';

import { revalidatePath } from 'next/cache';
import { apiRequestAdmin } from '../../shared/api/admin-request';
import { apiRequest } from '../../shared/api/client';
import {
  AddReviewDocument,
  DeleteReviewDocument,
  MyReviewsDocument,
  ReviewState as ApiReviewState,
  SetReviewStateDocument,
} from '../../shared/api/generated';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import type { Review, ReviewState } from '../../shared/types/tenancy';
import { deleteReviewSchema, reviewSchema, setReviewStateSchema } from './utils/schemas';

/**
 * Reviews module — public submission (014) + authenticated moderation (015/016).
 * Public write uses the plain transport; moderation uses `apiRequestAdmin`
 * (session-aware). Constitution §5.VI.
 */

interface ApiReviewRow {
  id: string;
  author: string;
  rating: number;
  comment: string;
  state: ApiReviewState;
  createdAt: string;
}

const STATE_MAP: Record<ApiReviewState, ReviewState> = {
  [ApiReviewState.Pending]: 'pending',
  [ApiReviewState.Approved]: 'approved',
  [ApiReviewState.Rejected]: 'rejected',
};

function toApiState(state: ReviewState): ApiReviewState {
  switch (state) {
    case 'approved':
      return ApiReviewState.Approved;
    case 'rejected':
      return ApiReviewState.Rejected;
    default:
      return ApiReviewState.Pending;
  }
}

function mapReview(row: ApiReviewRow, tenantId = ''): Review {
  return {
    id: row.id,
    tenantId,
    author: row.author,
    rating: row.rating,
    comment: row.comment,
    state: STATE_MAP[row.state],
    date: row.createdAt,
  };
}

export async function submitPublicReview(input: unknown): Promise<ActionResult<Review>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa tu reseña.', zodFields(parsed.error));
  }
  const result = await apiRequest(AddReviewDocument, {
    input: {
      tenantSlug: parsed.data.tenantSlug,
      author: parsed.data.author,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });
  if (!result.ok) return result;
  // The public portal is dynamic; invalidate its cached data for this business.
  revalidatePath(`/${parsed.data.tenantSlug}`);
  return ok(mapReview(result.data.addReview));
}

/** Authenticated admin read: the caller's reviews in any state (optionally filtered). */
export async function listMyReviews(state?: ReviewState): Promise<ActionResult<Review[]>> {
  const result = await apiRequestAdmin(MyReviewsDocument, {
    state: state ? toApiState(state) : null,
  });
  if (!result.ok) return result;
  return ok(result.data.myReviews.map((row) => mapReview(row)));
}

/** Authenticated moderation: approve or reject a review (idempotent). */
export async function setReviewState(input: unknown): Promise<ActionResult<Review>> {
  const parsed = setReviewStateSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa la moderación.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(SetReviewStateDocument, {
    id: parsed.data.id,
    state: toApiState(parsed.data.state),
  });
  if (!result.ok) return result;
  revalidatePath('/admin/reviews');
  return ok(mapReview(result.data.setReviewState));
}

/** Authenticated moderation: delete a review entirely. */
export async function deleteReview(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteReviewSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa la solicitud.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(DeleteReviewDocument, { id: parsed.data.id });
  if (!result.ok) return result;
  revalidatePath('/admin/reviews');
  return ok({ id: parsed.data.id });
}
