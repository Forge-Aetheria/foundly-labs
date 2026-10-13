import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReviewsService } from './reviews.service';
import { AddReviewInput, ReviewObject, ReviewSummaryObject } from './reviews.types';

@Resolver(() => ReviewObject)
export class ReviewsResolver {
  constructor(private readonly service: ReviewsService) {}

  /** Public: a business's reviews + aggregate rating by id or public slug. */
  @Query(() => ReviewSummaryObject)
  reviews(
    @Args('tenantId', { type: () => ID, nullable: true }) tenantId?: string | null,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string | null,
  ): Promise<ReviewSummaryObject> {
    return this.service.summary({ tenantId: tenantId ?? null, tenantSlug: tenantSlug ?? null });
  }

  /** Public: a visitor submits a review (no account required). */
  @Mutation(() => ReviewObject)
  addReview(
    @Args('input', { type: () => AddReviewInput }) input: AddReviewInput,
  ): Promise<ReviewObject> {
    return this.service.add(input);
  }
}
