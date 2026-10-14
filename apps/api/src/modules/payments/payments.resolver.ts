import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { PaymentsService } from './payments.service';
import { PaymentMethodObject, UpsertPaymentMethodInput } from './payments.types';

@Resolver(() => PaymentMethodObject)
export class PaymentsResolver {
  constructor(private readonly service: PaymentsService) {}

  /** Public: a business's active payment methods by id or public slug. */
  @Query(() => [PaymentMethodObject])
  paymentMethods(
    @Args('tenantId', { type: () => ID, nullable: true }) tenantId?: string | null,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string | null,
  ): Promise<PaymentMethodObject[]> {
    return this.service.listPublic({ tenantId: tenantId ?? null, tenantSlug: tenantSlug ?? null });
  }

  /** Authenticated: the caller's payment methods, any active state. */
  @Query(() => [PaymentMethodObject])
  @RequireAuth()
  myPaymentMethods(
    @AuthUserDecorator() user: AuthUser,
  ): ReturnType<PaymentsService['listForAdmin']> {
    return this.service.listForAdmin(user);
  }

  /** Authenticated: create or replace a method for the caller's business. */
  @Mutation(() => PaymentMethodObject)
  @RequireAuth()
  upsertPaymentMethod(
    @AuthUserDecorator() user: AuthUser,
    @Args('input', { type: () => UpsertPaymentMethodInput }) input: UpsertPaymentMethodInput,
  ): ReturnType<PaymentsService['upsert']> {
    return this.service.upsert(user, input);
  }

  /** Authenticated: delete one of the caller's methods. */
  @Mutation(() => Boolean)
  @RequireAuth()
  deletePaymentMethod(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.remove(user, id);
  }
}
