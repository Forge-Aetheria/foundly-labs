import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

/** A customer review of a business (feature 013). */
@ObjectType()
export class ReviewObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  author!: string;

  @Field(() => Int)
  rating!: number;

  @Field(() => String)
  comment!: string;

  @Field(() => String)
  createdAt!: string;
}

/** A business's reviews plus the aggregate rating (feature 013). */
@ObjectType()
export class ReviewSummaryObject {
  @Field(() => [ReviewObject])
  items!: ReviewObject[];

  @Field(() => Float, { nullable: true })
  average?: number | null;

  @Field(() => Int)
  count!: number;
}

@InputType()
export class AddReviewInput {
  @Field(() => ID, { nullable: true })
  tenantId?: string | null;

  @Field(() => String, { nullable: true })
  tenantSlug?: string | null;

  @Field(() => String)
  author!: string;

  @Field(() => Int)
  rating!: number;

  @Field(() => String)
  comment!: string;

  constructor() {
    this.author = '';
    this.rating = 0;
    this.comment = '';
  }
}
