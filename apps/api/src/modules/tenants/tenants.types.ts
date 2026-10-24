import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { AdvanceKind } from '../payments/payments.types';

@ObjectType()
export class BusinessProfileObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  instagram?: string | null;

  @Field(() => String, { nullable: true })
  whatsapp?: string | null;

  @Field(() => String, { nullable: true })
  logo?: string | null;

  @Field(() => String, { nullable: true })
  cover?: string | null;

  @Field(() => String, { nullable: true })
  brandColors?: string | null;

  @Field(() => [PortalPolicyObject])
  policies!: PortalPolicyObject[];
}

@ObjectType()
export class ServiceObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int)
  durationMinutes!: number;

  @Field(() => Int)
  priceCents!: number;

  @Field(() => String)
  currency!: string;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Boolean)
  active!: boolean;

  @Field(() => Boolean)
  requiresAdvance!: boolean;

  @Field(() => AdvanceKind, { nullable: true })
  advanceKind?: AdvanceKind | null;

  @Field(() => Int, { nullable: true })
  advanceValue?: number | null;
}

/** One weekday opening range on a public directory card (018). */
@ObjectType('BusinessSchedule')
export class BusinessScheduleObject {
  @Field(() => Int)
  weekday!: number;

  @Field(() => String)
  startTime!: string;

  @Field(() => String)
  endTime!: string;
}

/** Public directory listing entry (018). */
@ObjectType('BusinessSummary')
export class BusinessSummaryObject {
  @Field(() => ID)
  tenantId!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  category!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  logo?: string | null;

  @Field(() => String, { nullable: true })
  cover?: string | null;

  @Field(() => [BusinessScheduleObject])
  schedule!: BusinessScheduleObject[];
}

@ObjectType()
export class TenantObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  category!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  timezone!: string;

  @Field(() => String)
  currency!: string;

  @Field(() => Boolean)
  isPublic!: boolean;

  @Field(() => BusinessProfileObject, { nullable: true })
  profile?: BusinessProfileObject | null;

  @Field(() => [ServiceObject])
  services!: ServiceObject[];
}

@InputType()
export class BusinessProfileInput {
  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  instagram?: string | null;

  @Field(() => String, { nullable: true })
  whatsapp?: string | null;

  @Field(() => String, { nullable: true })
  logo?: string | null;

  @Field(() => String, { nullable: true })
  cover?: string | null;

  @Field(() => String, { nullable: true })
  brandColors?: string | null;

  @Field(() => String, { nullable: true })
  policies?: string | null;
}

@InputType()
export class CreateTenantInput {
  @Field(() => String)
  name!: string;

  @Field(() => String)
  category!: string;

  @Field(() => String)
  timezone!: string;

  @Field(() => String, { nullable: true })
  currency?: string | null;

  @Field(() => BusinessProfileInput)
  profile!: BusinessProfileInput;
}

/** A reservation/cancellation policy exposed on the public profile (feature 013). */
@ObjectType()
export class PortalPolicyObject {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  body!: string;
}

/** A reservation/cancellation policy submitted by the profile editor (feature 013). */
@InputType()
export class BusinessPolicyInput {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  body!: string;

  constructor() {
    this.title = '';
    this.body = '';
  }
}

/** Partial update of the business identity + profile (feature 013). */
@InputType()
export class UpdateBusinessProfileInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => String, { nullable: true })
  slug?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  instagram?: string | null;

  @Field(() => String, { nullable: true })
  whatsapp?: string | null;

  @Field(() => String, { nullable: true })
  logo?: string | null;

  @Field(() => String, { nullable: true })
  cover?: string | null;

  @Field(() => Boolean, { nullable: true })
  isPublic?: boolean | null;

  @Field(() => [BusinessPolicyInput], { nullable: true })
  policies?: BusinessPolicyInput[] | null;
}
