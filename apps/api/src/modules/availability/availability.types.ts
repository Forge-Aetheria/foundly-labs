import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Availability')
export class AvailabilityObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  tenantId!: string;

  @Field(() => String, { nullable: true })
  specialistId?: string | null;

  @Field(() => Int)
  weekday!: number;

  @Field(() => String)
  startTime!: string;

  @Field(() => String)
  endTime!: string;

  @Field(() => Int)
  slotGranularityMinutes!: number;

  @Field(() => Int)
  minLeadTimeMinutes!: number;

  @Field(() => Int)
  bookingHorizonDays!: number;

  @Field(() => String, { nullable: true })
  breaks?: string | null;
}

@InputType()
export class CreateAvailabilityInput {
  @Field(() => String, { nullable: true })
  tenantId?: string | null;

  @Field(() => String, { nullable: true })
  tenantSlug?: string | null;

  @Field(() => String, { nullable: true })
  specialistId?: string | null;

  @Field(() => Int)
  weekday!: number;

  @Field(() => String)
  startTime!: string;

  @Field(() => String)
  endTime!: string;

  @Field(() => Int, { nullable: true })
  slotGranularityMinutes?: number | null;

  @Field(() => Int, { nullable: true })
  minLeadTimeMinutes?: number | null;

  @Field(() => Int, { nullable: true })
  bookingHorizonDays?: number | null;

  @Field(() => String, { nullable: true })
  breaks?: string | null;
}

@InputType()
export class UpdateAvailabilityInput {
  @Field(() => String, { nullable: true })
  specialistId?: string | null;

  @Field(() => Int, { nullable: true })
  weekday?: number | null;

  @Field(() => String, { nullable: true })
  startTime?: string | null;

  @Field(() => String, { nullable: true })
  endTime?: string | null;

  @Field(() => Int, { nullable: true })
  slotGranularityMinutes?: number | null;

  @Field(() => Int, { nullable: true })
  minLeadTimeMinutes?: number | null;

  @Field(() => Int, { nullable: true })
  bookingHorizonDays?: number | null;

  @Field(() => String, { nullable: true })
  breaks?: string | null;
}
