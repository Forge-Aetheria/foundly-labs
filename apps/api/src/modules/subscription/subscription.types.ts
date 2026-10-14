import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

/** Subscription tier of a business (mirrors the API contract; the requirement writes FREE | PRO). */
export const SubscriptionPlan = {
  FREE: 'FREE',
  PRO: 'PRO',
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

registerEnumType(SubscriptionPlan, { name: 'SubscriptionPlan' });

/** Lifecycle state of a subscription (lower-case like `ReviewState`; only `active` can be Pro). */
export const SubscriptionStatus = {
  active: 'active',
  past_due: 'past_due',
  expired: 'expired',
  canceled: 'canceled',
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });

/** Usage against one plan limit. */
@ObjectType('SubscriptionUsage')
export class SubscriptionUsageObject {
  @Field(() => Int)
  used!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Boolean)
  unlimited!: boolean;
}

/** Per-limit usage for the business. */
@ObjectType('SubscriptionLimits')
export class SubscriptionLimitsObject {
  @Field(() => SubscriptionUsageObject)
  services!: SubscriptionUsageObject;

  @Field(() => SubscriptionUsageObject)
  team!: SubscriptionUsageObject;
}

/** Authenticated view of a business subscription and its current usage. */
@ObjectType('SubscriptionSummary')
export class SubscriptionSummaryObject {
  @Field(() => SubscriptionPlan)
  plan!: SubscriptionPlan;

  @Field(() => SubscriptionPlan)
  effectivePlan!: SubscriptionPlan;

  @Field(() => SubscriptionStatus)
  status!: SubscriptionStatus;

  @Field(() => String, { nullable: true })
  expiresAt?: string | null;

  @Field(() => SubscriptionLimitsObject)
  limits!: SubscriptionLimitsObject;
}
