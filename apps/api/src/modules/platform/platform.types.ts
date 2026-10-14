import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { SubscriptionPlan, SubscriptionStatus } from '../subscription/subscription.types';

/** Subscription plan distribution across all businesses (019). */
@ObjectType('PlanDistribution')
export class PlanDistributionObject {
  @Field(() => Int)
  free!: number;

  @Field(() => Int)
  pro!: number;
}

/** User counts from the identity provider; `available` is false when it cannot be reached. */
@ObjectType('UserMetrics')
export class UserMetricsObject {
  @Field(() => Boolean)
  available!: boolean;

  @Field(() => Int, { nullable: true })
  total?: number | null;

  @Field(() => Int, { nullable: true })
  active?: number | null;
}

/** Business counts (all registered vs active). */
@ObjectType('BusinessMetrics')
export class BusinessMetricsObject {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  active!: number;
}

/** Global platform metrics for the Super Admin dashboard (019). */
@ObjectType('PlatformMetrics')
export class PlatformMetricsObject {
  @Field(() => BusinessMetricsObject)
  businesses!: BusinessMetricsObject;

  @Field(() => UserMetricsObject)
  users!: UserMetricsObject;

  @Field(() => PlanDistributionObject)
  plans!: PlanDistributionObject;

  @Field(() => Float)
  proConversion!: number;
}

/** A business row in the platform management table (019). */
@ObjectType('ManagedBusiness')
export class ManagedBusinessObject {
  @Field(() => ID)
  tenantId!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  name!: string;

  @Field(() => SubscriptionPlan)
  plan!: SubscriptionPlan;

  @Field(() => SubscriptionStatus)
  status!: SubscriptionStatus;

  @Field(() => String, { nullable: true })
  expiresAt?: string | null;
}

/** Super-Admin override of a business subscription (partial; 019). */
@InputType()
export class OverrideTenantSubscriptionInput {
  @Field(() => ID)
  tenantId!: string;

  @Field(() => SubscriptionPlan, { nullable: true })
  plan?: SubscriptionPlan | null;

  @Field(() => SubscriptionStatus, { nullable: true })
  status?: SubscriptionStatus | null;

  @Field(() => String, { nullable: true })
  expiresAt?: string | null;
}
