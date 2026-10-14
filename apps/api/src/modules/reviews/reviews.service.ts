import { Inject, Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import type { AuthUser } from '../auth/jwt.types';
import { notFoundError, validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import { REVIEWS_STORE, type ReviewRow, type ReviewsStore } from './reviews.store';
import { ReviewState, type AddReviewInput, type ReviewSummaryObject } from './reviews.types';

const MAX_AUTHOR_LENGTH = 120;
const MAX_COMMENT_LENGTH = 2000;

function scopeError(): GraphQLError {
  return new GraphQLError('Missing tenant scope', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

/** Public reviews read/submission (013) + authenticated moderation (015). */
@Injectable()
export class ReviewsService {
  constructor(@Inject(REVIEWS_STORE) private readonly store: ReviewsStore) {}

  /** Resolve the authoritative tenant scope from the authenticated identity (never client input). */
  requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw scopeError();
    }
    return user.tenantId;
  }

  /** Public: a business's APPROVED reviews (newest first) plus the aggregate rating. Unknown slug → empty. */
  async summary(scope: TenantScopeInput): Promise<ReviewSummaryObject> {
    const tenantId = await this.store.resolveTenantId(scope);
    if (!tenantId) {
      return { items: [], average: null, count: 0 };
    }
    const rows = await this.store.listByTenant(tenantId, ReviewState.approved);
    const count = rows.length;
    const average = count > 0 ? rows.reduce((sum, row) => sum + row.rating, 0) / count : null;
    return { items: rows, average, count };
  }

  /** Public guest review submission. New submissions start as `pending`. */
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

  /** Authenticated admin read: the caller's reviews in any state, optionally filtered. */
  async listForAdmin(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    state?: ReviewState,
  ): Promise<ReviewRow[]> {
    const tenantId = this.requireTenant(user);
    return this.store.listByTenant(tenantId, state);
  }

  /** Authenticated moderation: approve/reject a review (idempotent for the target state). */
  async setState(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    id: string,
    state: ReviewState,
  ): Promise<ReviewRow> {
    const tenantId = this.requireTenant(user);
    if (state === ReviewState.pending) {
      throw validationError('state must be approved or rejected');
    }
    const row = await this.store.setState(id, tenantId, state);
    if (!row) {
      throw notFoundError('Review not found');
    }
    return row;
  }

  /** Authenticated moderation: delete a review entirely. */
  async remove(user: Pick<AuthUser, 'tenantId'> | undefined, id: string): Promise<boolean> {
    const tenantId = this.requireTenant(user);
    const deleted = await this.store.deleteById(id, tenantId);
    if (!deleted) {
      throw notFoundError('Review not found');
    }
    return true;
  }
}
