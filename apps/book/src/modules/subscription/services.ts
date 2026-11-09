import { apiRequestAuthed } from '../../shared/api/authed-request';
import {
  BillingInstructionsDocument,
  CreateBinancePaymentOrderDocument,
  CreatePaypalSubscriptionOrderDocument,
  MyPaymentTransactionsDocument,
  MySubscriptionDocument,
  SubmitManualPaymentDocument,
  type BillingInstructionsQuery,
  type CreateBinancePaymentOrderMutation,
  type CreatePaypalSubscriptionOrderMutation,
  type MyPaymentTransactionsQuery,
  type MySubscriptionQuery,
  type SubmitManualPaymentMutation,
  type SubmitManualPaymentMutationVariables,
} from '../../shared/api/generated';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import { manualPaymentSchema } from './utils/schemas';
import type {
  BillingInstructionsView,
  CheckoutSessionView,
  ManualPaymentValues,
  PaymentGatewayView,
  PaymentStatusView,
  PaymentTransactionView,
  SubscriptionPlanView,
  SubscriptionStatusView,
  SubscriptionSummaryView,
} from './utils/types';

function plan(value: string): SubscriptionPlanView {
  return value === 'PRO' ? 'PRO' : 'FREE';
}

function subscriptionStatus(value: string): SubscriptionStatusView {
  return value === 'past_due' || value === 'expired' || value === 'canceled'
    ? value
    : 'active';
}

function paymentStatus(value: string): PaymentStatusView {
  switch (value) {
    case 'PENDING_APPROVAL':
    case 'COMPLETED':
    case 'REJECTED':
    case 'FAILED':
      return value;
    default:
      return 'PENDING';
  }
}

function gateway(value: string): PaymentGatewayView {
  return value === 'PAYPAL' ||
    value === 'BINANCE' ||
    value === 'PAGO_MOVIL' ||
    value === 'TRANSFERENCIA'
    ? value
    : 'PAGO_MOVIL';
}

function mapSubscription(dto: MySubscriptionQuery['mySubscription']): SubscriptionSummaryView {
  return {
    plan: plan(dto.plan),
    effectivePlan: plan(dto.effectivePlan),
    status: subscriptionStatus(dto.status),
    expiresAt: dto.expiresAt ?? null,
    limits: {
      services: { ...dto.limits.services },
      team: { ...dto.limits.team },
    },
  };
}

function mapTransaction(
  dto: MyPaymentTransactionsQuery['myPaymentTransactions'][number],
): PaymentTransactionView {
  return {
    id: dto.id,
    gateway: gateway(dto.gateway),
    status: paymentStatus(dto.status),
    plan: plan(dto.plan),
    amount: dto.amount,
    currency: dto.currency,
    gatewayOrderId: dto.gatewayOrderId ?? null,
    referenceNumber: dto.referenceNumber ?? null,
    expiresAt: dto.expiresAt ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapCheckout(
  dto:
    | CreatePaypalSubscriptionOrderMutation['createPaypalSubscriptionOrder']
    | CreateBinancePaymentOrderMutation['createBinancePaymentOrder'],
): CheckoutSessionView {
  return {
    transactionId: dto.transactionId,
    gateway: gateway(dto.gateway),
    checkoutUrl: dto.checkoutUrl ?? null,
    token: dto.token ?? null,
    gatewayOrderId: dto.gatewayOrderId ?? null,
  };
}

export async function getSubscription(): Promise<ActionResult<SubscriptionSummaryView>> {
  const result = await apiRequestAuthed(MySubscriptionDocument, {});
  if (!result.ok) return result;
  return ok(mapSubscription(result.data.mySubscription));
}

export async function getBillingInstructions(): Promise<ActionResult<BillingInstructionsView>> {
  const result = await apiRequestAuthed(BillingInstructionsDocument, {});
  if (!result.ok) return result;
  const dto: BillingInstructionsQuery['billingInstructions'] = result.data.billingInstructions;
  return ok({
    plan: { ...dto.plan },
    manual: { ...dto.manual, note: dto.manual.note ?? null },
  });
}

export async function listPaymentTransactions(
  limit = 10,
  offset = 0,
): Promise<ActionResult<PaymentTransactionView[]>> {
  const result = await apiRequestAuthed(MyPaymentTransactionsDocument, { limit, offset });
  if (!result.ok) return result;
  return ok(result.data.myPaymentTransactions.map(mapTransaction));
}

export async function createPaypalOrder(): Promise<ActionResult<CheckoutSessionView>> {
  const result = await apiRequestAuthed(CreatePaypalSubscriptionOrderDocument, {});
  if (!result.ok) return result;
  return ok(mapCheckout(result.data.createPaypalSubscriptionOrder));
}

export async function createBinanceOrder(): Promise<ActionResult<CheckoutSessionView>> {
  const result = await apiRequestAuthed(CreateBinancePaymentOrderDocument, {});
  if (!result.ok) return result;
  return ok(mapCheckout(result.data.createBinancePaymentOrder));
}

export async function submitManualPayment(
  input: unknown,
): Promise<ActionResult<PaymentTransactionView>> {
  const parsed = manualPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos del pago.', zodFields(parsed.error));
  }
  const values: ManualPaymentValues = parsed.data;
  const result = await apiRequestAuthed<SubmitManualPaymentMutation, SubmitManualPaymentMutationVariables>(
    SubmitManualPaymentDocument,
    { input: values as SubmitManualPaymentMutationVariables['input'] },
  );
  if (!result.ok) {
    if (result.error.code === 'PAYMENT_DUPLICATE_REFERENCE') {
      return fail('PAYMENT_DUPLICATE_REFERENCE', result.error.message, {
        referenceNumber: 'Esa referencia ya fue registrada.',
      });
    }
    return result;
  }
  return ok(mapTransaction(result.data.submitManualPayment));
}
