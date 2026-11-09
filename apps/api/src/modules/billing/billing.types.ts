import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { SubscriptionPlan } from '../subscription/subscription.types';

/** Payment provider used for a subscription charge. */
export const PaymentGateway = {
  PAYPAL: 'PAYPAL',
  BINANCE: 'BINANCE',
  PAGO_MOVIL: 'PAGO_MOVIL',
  TRANSFERENCIA: 'TRANSFERENCIA',
} as const;

export type PaymentGateway = (typeof PaymentGateway)[keyof typeof PaymentGateway];

registerEnumType(PaymentGateway, { name: 'PaymentGateway' });

/** Payment attempt lifecycle, separate from the tenant subscription status. */
export const PaymentStatus = {
  PENDING: 'PENDING',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  FAILED: 'FAILED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

/** Checkout information returned to the client after creating a provider order. */
@ObjectType('CheckoutSession')
export class CheckoutSessionObject {
  @Field(() => ID)
  transactionId!: string;

  @Field(() => PaymentGateway)
  gateway!: PaymentGateway;

  @Field(() => String, { nullable: true })
  checkoutUrl?: string | null;

  @Field(() => String, { nullable: true })
  token?: string | null;

  @Field(() => String, { nullable: true })
  gatewayOrderId?: string | null;
}

/** Auditable subscription payment attempt. */
@ObjectType('PaymentTransaction')
export class PaymentTransactionObject {
  @Field(() => ID)
  id!: string;

  @Field(() => PaymentGateway)
  gateway!: PaymentGateway;

  @Field(() => PaymentStatus)
  status!: PaymentStatus;

  @Field(() => SubscriptionPlan)
  plan!: SubscriptionPlan;

  /** Exact decimal serialized as string to avoid floating-point loss. */
  @Field(() => String)
  amount!: string;

  @Field(() => String)
  currency!: string;

  @Field(() => String, { nullable: true })
  gatewayOrderId?: string | null;

  @Field(() => String, { nullable: true })
  referenceNumber?: string | null;

  @Field(() => String, { nullable: true })
  expiresAt?: string | null;

  @Field(() => String)
  createdAt!: string;

  @Field(() => String)
  updatedAt!: string;
}

/** Price/duration of the plan returned to the checkout UI. */
@ObjectType('BillingPlanInstructions')
export class BillingPlanInstructionsObject {
  @Field(() => String)
  amount!: string;

  @Field(() => String)
  currency!: string;

  @Field(() => Int)
  durationDays!: number;
}

/** Platform receiving data for manual Pago Móvil / Transferencia payments. */
@ObjectType('ManualPaymentInstructions')
export class ManualPaymentInstructionsObject {
  @Field(() => String)
  bank!: string;

  @Field(() => String)
  cedula!: string;

  @Field(() => String)
  phone!: string;

  @Field(() => String)
  rateVesPerUsd!: string;

  @Field(() => String, { nullable: true })
  note?: string | null;
}

/** Server-provided checkout data for the Book subscription tab. */
@ObjectType('BillingInstructions')
export class BillingInstructionsObject {
  @Field(() => BillingPlanInstructionsObject)
  plan!: BillingPlanInstructionsObject;

  @Field(() => ManualPaymentInstructionsObject)
  manual!: ManualPaymentInstructionsObject;
}

/** Manual payment report (Pago Móvil / Transferencia). */
@InputType()
export class SubmitManualPaymentInput {
  @Field(() => PaymentGateway)
  gateway!: PaymentGateway;

  @Field(() => String)
  referenceNumber!: string;

  @Field(() => String)
  bank!: string;

  @Field(() => String)
  amount!: string;

  @Field(() => String)
  currency!: string;

  @Field(() => String)
  phone!: string;
}
