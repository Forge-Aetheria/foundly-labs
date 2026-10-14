import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { ReviewsService } from './reviews.service';
import { AddReviewInput, ReviewObject, ReviewState, ReviewSummaryObject } from './reviews.types';

@Resolver(() => ReviewObject)
export class ReviewsResolver {
  constructor(private readonly service: ReviewsService) {}

  /** Public: a business's approved reviews + aggregate rating by id or public slug. */
  @Query(() => ReviewSummaryObject)
  reviews(
    @Args('tenantId', { type: () => ID, nullable: true }) tenantId?: string | null,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string | null,
  ): Promise<ReviewSummaryObject> {
    return this.service.summary({ tenantId: tenantId ?? null, tenantSlug: tenantSlug ?? null });
  }

  /** Public: a visitor submits a review (no account required); it starts as `pending`. */
  @Mutation(() => ReviewObject)
  addReview(
    @Args('input', { type: () => AddReviewInput }) input: AddReviewInput,
  ): Promise<ReviewObject> {
    return this.service.add(input);
  }

  /** Authenticated: the caller's business reviews in any state, optionally filtered. */
  @Query(() => [ReviewObject])
  @RequireAuth()
  myReviews(
    @AuthUserDecorator() user: AuthUser,
    @Args('state', { type: () => ReviewState, nullable: true }) state?: ReviewState | null,
  ): ReturnType<ReviewsService['listForAdmin']> {
    return this.service.listForAdmin(user, state ?? undefined);
  }

  /** Authenticated: approve or reject a review (idempotent for the target state). */
  @Mutation(() => ReviewObject)
  @RequireAuth()
  setReviewState(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('state', { type: () => ReviewState }) state: ReviewState,
  ): ReturnType<ReviewsService['setState']> {
    return this.service.setState(user, id, state);
  }

  /** Authenticated: delete a review entirely. */
  @Mutation(() => Boolean)
  @RequireAuth()
  deleteReview(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.remove(user, id);
  }
}
