'use server';

import { apiRequest } from '../../shared/api/client';
import { AddReviewDocument } from '../../shared/api/generated';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import type { Review } from '../../shared/types/tenancy';
import { reviewSchema } from './utils/schemas';

/**
 * Reviews module — public submission (feature 014; constitution §5.VI).
 * Public write (no session), so it uses the plain transport.
 */

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
  const review = result.data.addReview;
  return ok({
    id: review.id,
    tenantId: '',
    author: review.author,
    rating: review.rating,
    comment: review.comment,
    date: review.createdAt,
  });
}
