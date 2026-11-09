import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { AllowInactiveTenant } from '../auth/tenant-status.decorators';
import { RequireSuperAdmin } from '../platform/platform.decorators';
import { BillingService } from './billing.service';
import {
  BillingInstructionsObject,
  CheckoutSessionObject,
  PaymentTransactionObject,
  SubmitManualPaymentInput,
} from './billing.types';

@Resolver(() => PaymentTransactionObject)
export class BillingResolver {
  constructor(private readonly service: BillingService) {}

  /** Authenticated: plan and manual-payment instructions for the checkout UI. */
  @Query(() => BillingInstructionsObject)
  @RequireAuth()
  @AllowInactiveTenant()
  billingInstructions(): BillingInstructionsObject {
    return this.service.getInstructions();
  }

  /** Authenticated: create a PayPal subscription checkout. */
  @Mutation(() => CheckoutSessionObject)
  @RequireAuth()
  @AllowInactiveTenant()
  createPaypalSubscriptionOrder(
    @AuthUserDecorator() user: AuthUser,
  ): Promise<CheckoutSessionObject> {
    return this.service.createPaypalSubscriptionOrder(user);
  }

  /** Authenticated: create a Binance Pay checkout. */
  @Mutation(() => CheckoutSessionObject)
  @RequireAuth()
  @AllowInactiveTenant()
  createBinancePaymentOrder(
    @AuthUserDecorator() user: AuthUser,
  ): Promise<CheckoutSessionObject> {
    return this.service.createBinancePaymentOrder(user);
  }

  /** Authenticated: report a manual Pago Móvil/Transferencia payment. */
  @Mutation(() => PaymentTransactionObject)
  @RequireAuth()
  @AllowInactiveTenant()
  submitManualPayment(
    @AuthUserDecorator() user: AuthUser,
    @Args('input', { type: () => SubmitManualPaymentInput }) input: SubmitManualPaymentInput,
  ): Promise<PaymentTransactionObject> {
    return this.service.submitManualPayment(user, input);
  }

  /** Super Admin: approve a pending manual payment and activate/extend the subscription. */
  @Mutation(() => PaymentTransactionObject)
  @RequireSuperAdmin()
  approveManualPayment(
    @AuthUserDecorator() user: AuthUser,
    @Args('transactionId', { type: () => ID }) transactionId: string,
  ): Promise<PaymentTransactionObject> {
    return this.service.approveManualPayment(user, transactionId);
  }

  /** Authenticated: the caller tenant's payment history. */
  @Query(() => [PaymentTransactionObject])
  @RequireAuth()
  @AllowInactiveTenant()
  myPaymentTransactions(
    @AuthUserDecorator() user: AuthUser,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number | null,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number | null,
  ): Promise<PaymentTransactionObject[]> {
    return this.service.listTransactions(user, limit, offset);
  }
}
