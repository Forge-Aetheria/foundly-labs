import { Module } from '@nestjs/common';
import { REVIEWS_STORE, PrismaReviewsStore } from './reviews.store';
import { ReviewsService } from './reviews.service';
import { ReviewsResolver } from './reviews.resolver';

@Module({
  providers: [
    { provide: REVIEWS_STORE, useClass: PrismaReviewsStore },
    ReviewsService,
    ReviewsResolver,
  ],
})
export class ReviewsModule {}
