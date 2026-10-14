import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { AdvanceKind } from '../payments/payments.types';

@ObjectType('SpecialistRef')
export class SpecialistRefObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;
}

@ObjectType('Service')
export class ServiceObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  tenantId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int)
  durationMinutes!: number;

  @Field(() => Int)
  bufferMinutes!: number;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Int)
  priceCents!: number;

  @Field(() => String)
  currency!: string;

  @Field(() => Boolean)
  active!: boolean;

  @Field(() => Boolean)
  requiresAdvance!: boolean;

  @Field(() => AdvanceKind, { nullable: true })
  advanceKind?: AdvanceKind | null;

  @Field(() => Int, { nullable: true })
  advanceValue?: number | null;

  @Field(() => [SpecialistRefObject])
  specialists!: SpecialistRefObject[];
}

@InputType()
export class CreateServiceInput {
  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int)
  durationMinutes!: number;

  @Field(() => Int, { nullable: true })
  bufferMinutes?: number | null;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Int)
  priceCents!: number;

  @Field(() => String, { nullable: true })
  currency?: string | null;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  requiresAdvance?: boolean | null;

  @Field(() => AdvanceKind, { nullable: true })
  advanceKind?: AdvanceKind | null;

  @Field(() => Int, { nullable: true })
  advanceValue?: number | null;

  @Field(() => String, { nullable: true })
  tenantId?: string | null;

  @Field(() => String, { nullable: true })
  tenantSlug?: string | null;
}

@InputType()
export class UpdateServiceInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int, { nullable: true })
  durationMinutes?: number | null;

  @Field(() => Int, { nullable: true })
  bufferMinutes?: number | null;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Int, { nullable: true })
  priceCents?: number | null;

  @Field(() => String, { nullable: true })
  currency?: string | null;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  requiresAdvance?: boolean | null;

  @Field(() => AdvanceKind, { nullable: true })
  advanceKind?: AdvanceKind | null;

  @Field(() => Int, { nullable: true })
  advanceValue?: number | null;
}
