import { Field, ID, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

/** Closed set of payment method kinds (mirrors the API contract, lower-case like `ReviewState`). */
export const PaymentMethodType = {
  mobile_payment: 'mobile_payment',
  bank_transfer: 'bank_transfer',
  binance: 'binance',
} as const;
export type PaymentMethodType =
  (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

registerEnumType(PaymentMethodType, { name: 'PaymentMethodType' });

/** How a service advance is expressed: a fixed amount or a percentage of the price. */
export const AdvanceKind = {
  fixed: 'fixed',
  percent: 'percent',
} as const;
export type AdvanceKind = (typeof AdvanceKind)[keyof typeof AdvanceKind];

registerEnumType(AdvanceKind, { name: 'AdvanceKind' });

@ObjectType('PaymentMethodObject')
export class PaymentMethodObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  tenantId!: string;

  @Field(() => PaymentMethodType)
  type!: PaymentMethodType;

  @Field(() => String, { nullable: true })
  label?: string | null;

  @Field(() => String, { nullable: true })
  details?: string | null;

  @Field(() => String, { nullable: true })
  instructions?: string | null;

  @Field(() => Boolean)
  active!: boolean;

  @Field(() => String)
  createdAt!: string;

  @Field(() => String)
  updatedAt!: string;
}

@InputType()
export class UpsertPaymentMethodInput {
  @Field(() => PaymentMethodType)
  type!: PaymentMethodType;

  @Field(() => String, { nullable: true })
  label?: string | null;

  @Field(() => String, { nullable: true })
  details?: string | null;

  @Field(() => String, { nullable: true })
  instructions?: string | null;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | null;
}
