import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

/** A concrete unavailability interval for a business (and optionally a specialist) — feature 014. */
@ObjectType()
export class TimeBlockObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  tenantId!: string;

  @Field(() => String, { nullable: true })
  specialistId?: string | null;

  @Field(() => String)
  startAt!: string;

  @Field(() => String)
  endAt!: string;

  @Field(() => String, { nullable: true })
  reason?: string | null;
}

@InputType()
export class AddTimeBlockInput {
  @Field(() => ID, { nullable: true })
  tenantId?: string | null;

  @Field(() => String, { nullable: true })
  tenantSlug?: string | null;

  @Field(() => ID, { nullable: true })
  specialistId?: string | null;

  @Field(() => String)
  startAt!: string;

  @Field(() => String)
  endAt!: string;

  @Field(() => String, { nullable: true })
  reason?: string | null;

  constructor() {
    this.startAt = '';
    this.endAt = '';
  }
}
