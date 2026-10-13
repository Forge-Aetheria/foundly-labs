import { Inject, Injectable } from '@nestjs/common';
import { notFoundError, validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import { REVIEWS_STORE, type ReviewRow, type ReviewsStore } from './reviews.store';
import type { AddReviewInput, ReviewSummaryObject } from './reviews.types';

const MAX_AUTHOR_LENGTH = 120;
const MAX_COMMENT_LENGTH = 2000;

/** Public reviews read/submission (feature 013). */
@Injectable()
export class ReviewsService {
  constructor(@Inject(REVIEWS_STORE) private readonly store: ReviewsStore) {}

  /** A business's reviews (newest first) plus the aggregate rating. Unknown slug → empty. */
  async summary(scope: TenantScopeInput): Promise<ReviewSummaryObject> {
    const tenantId = await this.store.resolveTenantId(scope);
    if (!tenantId) {
      return { items: [], average: null, count: 0 };
    }
    const rows = await this.store.listByTenant(tenantId);
    const count = rows.length;
    const average = count > 0 ? rows.reduce((sum, row) => sum + row.rating, 0) / count : null;
    return { items: rows, average, count };
  }

  /** Public guest review submission. */
  async add(input: AddReviewInput): Promise<ReviewRow> {
    const author = input.author?.trim() ?? '';
    if (!author) {
      throw validationError('author is required');
    }
    if (author.length > MAX_AUTHOR_LENGTH) {
      throw validationError(`author must be at most ${MAX_AUTHOR_LENGTH} characters`);
    }
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw validationError('rating must be an integer between 1 and 5');
    }
    const comment = input.comment?.trim() ?? '';
    if (!comment) {
      throw validationError('comment is required');
    }
    if (comment.length > MAX_COMMENT_LENGTH) {
      throw validationError(`comment must be at most ${MAX_COMMENT_LENGTH} characters`);
    }

    const tenantId = await this.store.resolveTenantId({
      tenantId: input.tenantId ?? null,
      tenantSlug: input.tenantSlug ?? null,
    });
    if (!tenantId) {
      throw notFoundError('Business not found');
    }
    return this.store.create(tenantId, { author, rating: input.rating, comment });
  }
}
