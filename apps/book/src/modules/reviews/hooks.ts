'use client';

import type { ActionResult } from '../../shared/types/result';
import type { Review } from '../../shared/types/tenancy';
import { submitPublicReview } from './actions';

/**
 * Reviews client hooks (feature 014; constitution §5.VI).
 */
export function useSubmitReview(): (input: unknown) => Promise<ActionResult<Review>> {
  return (input) => submitPublicReview(input);
}
