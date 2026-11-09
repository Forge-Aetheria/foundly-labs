import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@foundly/database';
import { GraphQLError } from 'graphql';
import { createLogger } from '../../shared/logger/logger';
import { notFoundError, validationError } from '../../shared/tenant-scope';
import type { AuthUser } from '../auth/jwt.types';
import { SubscriptionPlan } from '../subscription/subscription.types';
import { BillingConfig } from './billing.config';
import {
  paymentDuplicateReference,
  paymentNotPending,
  paymentProviderError,
} from './billing.errors';
import {
  BILLING_STORE,
  type BillingStore,
  type PaymentTransactionRow,
} from './billing.store';
import {
  PaymentGateway,
  type BillingInstructionsObject,
  type CheckoutSessionObject,
  type PaymentTransactionObject,
  type SubmitManualPaymentInput,
} from './billing.types';
import { ManualPaymentNotifier } from './manual-payment.notifier';
import {
  BINANCE_PROVIDER,
  PAYPAL_PROVIDER,
  type PaymentProvider,
  type WebhookEvent,
} from './providers/payment-provider';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function metadataObject(row: PaymentTransactionRow): Record<string, unknown> {
  return typeof row.metadata === 'object' && row.metadata !== null && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

function toObject(row: PaymentTransactionRow): PaymentTransactionObject {
  return {
    id: row.id,
    gateway: row.gateway,
    status: row.status,
    plan: row.plan,
    amount: row.amount.toString(),
    currency: row.currency,
    gatewayOrderId: row.gatewayOrderId,
    referenceNumber: row.referenceNumber,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeCurrency(value: string): string {
  const currency = value.trim().toUpperCase();
  if (currency !== 'USD' && currency !== 'VES') {
    throw validationError('currency must be USD or VES');
  }
  return currency;
}

function normalizeAmount(value: string): string {
  let amount: Prisma.Decimal;
  try {
    amount = new Prisma.Decimal(value.trim());
  } catch {
    throw validationError('amount must be a valid decimal');
  }
  if (!amount.isFinite() || amount.lte(0)) {
    throw validationError('amount must be positive');
  }
  return amount.toFixed(2);
}

/** Owns subscription checkout, webhook processing and manual payment approval. */
@Injectable()
export class BillingService {
  private readonly logger = createLogger();

  constructor(
    @Inject(BILLING_STORE) private readonly store: BillingStore,
    private readonly config: BillingConfig,
    @Inject(PAYPAL_PROVIDER) private readonly paypal: PaymentProvider,
    @Inject(BINANCE_PROVIDER) private readonly binance: PaymentProvider,
    private readonly notifier: ManualPaymentNotifier,
  ) {}

  requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw new GraphQLError('Missing tenant scope', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    return user.tenantId;
  }

  /** Server-provided checkout data for the Book subscription tab. */
  getInstructions(): BillingInstructionsObject {
    const plan = this.config.proPlan();
    const manual = this.config.manualInstructions();
    return {
      plan: {
        amount: plan.amount,
        currency: plan.currency,
        durationDays: plan.durationDays,
      },
      manual,
    };
  }

  private providerFor(gateway: PaymentGateway): PaymentProvider {
    if (gateway === PaymentGateway.PAYPAL) return this.paypal;
    if (gateway === PaymentGateway.BINANCE) return this.binance;
    throw validationError('Unsupported automated gateway');
  }

  private durationFor(row: PaymentTransactionRow): number {
    const value = Number(metadataObject(row).durationDays);
    if (Number.isInteger(value) && value > 0) return value;
    return this.config.proPlan().durationDays;
  }

  private async createAutomatedOrder(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    gateway: PaymentGateway,
  ): Promise<CheckoutSessionObject> {
    const tenantId = this.requireTenant(user);
    const plan = this.config.proPlan();
    const provider = this.providerFor(gateway);
    const transaction = await this.store.create({
      tenantId,
      plan: SubscriptionPlan.PRO,
      gateway,
      status: 'PENDING',
      amount: plan.amount,
      currency: plan.currency,
      metadata: { durationDays: plan.durationDays },
    });

    try {
      const checkout = await provider.createCheckout({
        transactionId: transaction.id,
        tenantId,
        plan: SubscriptionPlan.PRO,
        amount: plan.amount,
        currency: plan.currency,
        returnUrl: this.config.returnUrl(),
        cancelUrl: this.config.cancelUrl(),
      });
      const metadata = {
        durationDays: plan.durationDays,
        ...(checkout.metadata ?? {}),
      } as Prisma.InputJsonValue;
      const updated = await this.store.updateCheckout(
        transaction.id,
        checkout.gatewayOrderId,
        metadata,
      );
      this.logger.info(
        {
          event: 'billing_checkout_created',
          transactionId: updated.id,
          tenantId,
          gateway,
        },
        'Subscription checkout created',
      );
      return {
        transactionId: updated.id,
        gateway,
        checkoutUrl: checkout.checkoutUrl ?? null,
        token: checkout.token ?? null,
        gatewayOrderId: updated.gatewayOrderId,
      };
    } catch (error) {
      await this.store.markStatus(transaction.id, 'FAILED', {
        durationDays: plan.durationDays,
        error: error instanceof Error ? error.message : 'provider error',
      });
      if (error instanceof Error && 'extensions' in error) throw error;
      throw paymentProviderError(
        error instanceof Error ? error.message : 'Payment provider error',
      );
    }
  }

  createPaypalSubscriptionOrder(
    user: Pick<AuthUser, 'tenantId'> | undefined,
  ): Promise<CheckoutSessionObject> {
    return this.createAutomatedOrder(user, PaymentGateway.PAYPAL);
  }

  createBinancePaymentOrder(
    user: Pick<AuthUser, 'tenantId'> | undefined,
  ): Promise<CheckoutSessionObject> {
    return this.createAutomatedOrder(user, PaymentGateway.BINANCE);
  }

  async submitManualPayment(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    input: SubmitManualPaymentInput,
  ): Promise<PaymentTransactionObject> {
    const tenantId = this.requireTenant(user);
    if (!this.config.isManualGateway(input.gateway)) {
      throw validationError('gateway must be PAGO_MOVIL or TRANSFERENCIA');
    }
    const referenceNumber = input.referenceNumber?.trim() ?? '';
    const bank = input.bank?.trim() ?? '';
    const phone = input.phone?.trim() ?? '';
    if (!referenceNumber) throw validationError('referenceNumber is required');
    if (!bank) throw validationError('bank is required');
    if (!phone) throw validationError('phone is required');
    const amount = normalizeAmount(input.amount);
    const currency = normalizeCurrency(input.currency);

    const duplicate = await this.store.findManualByReference(
      tenantId,
      input.gateway,
      referenceNumber,
    );
    if (duplicate) {
      throw paymentDuplicateReference();
    }

    const plan = this.config.proPlan();
    const row = await this.store.create({
      tenantId,
      plan: SubscriptionPlan.PRO,
      gateway: input.gateway,
      status: 'PENDING_APPROVAL',
      amount,
      currency,
      referenceNumber,
      metadata: {
        bank,
        phone,
        durationDays: plan.durationDays,
      },
    });
    await this.notifier.notifyPending(row);
    return toObject(row);
  }

  async approveManualPayment(
    user: AuthUser,
    transactionId: string,
  ): Promise<PaymentTransactionObject> {
    const row = await this.store.findById(transactionId);
    if (!row) throw notFoundError('Payment not found');
    if (!this.config.isManualGateway(row.gateway)) {
      throw paymentNotPending('Only manual payments can be approved');
    }
    if (row.status === 'COMPLETED') return toObject(row);
    if (row.status !== 'PENDING_APPROVAL') {
      throw paymentNotPending();
    }

    const metadata = {
      ...metadataObject(row),
      approvedBy: user.sub,
    } as Prisma.InputJsonValue;
    const completed = await this.store.completeTransaction({
      transactionId: row.id,
      durationDays: this.durationFor(row),
      reviewedBy: user.sub,
      metadata,
    });
    if (!completed) throw notFoundError('Payment not found');
    this.logger.info(
      {
        event: 'manual_payment_approved',
        transactionId: completed.id,
        tenantId: completed.tenantId,
        reviewedBy: user.sub,
      },
      'Manual subscription payment approved',
    );
    return toObject(completed);
  }

  async listTransactions(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    limit?: number | null,
    offset?: number | null,
  ): Promise<PaymentTransactionObject[]> {
    const tenantId = this.requireTenant(user);
    const take = limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(take) || take <= 0) {
      throw validationError('limit must be a positive integer');
    }
    const skip = offset ?? 0;
    if (!Number.isInteger(skip) || skip < 0) {
      throw validationError('offset must be a non-negative integer');
    }
    const rows = await this.store.listByTenant(tenantId, Math.min(take, MAX_LIMIT), skip);
    return rows.map(toObject);
  }

  async handleWebhook(
    gateway: PaymentGateway,
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<void> {
    const provider = this.providerFor(gateway);
    const event = await provider.verifyWebhook(rawBody, headers);
    this.logger.info(
      {
        event: 'billing_webhook_received',
        gateway,
        eventId: event.eventId,
        eventType: event.eventType,
        status: event.status,
      },
      'Billing webhook verified',
    );
    await this.applyWebhookEvent(gateway, event);
    this.logger.info(
      { event: 'billing_webhook_processed', gateway, eventId: event.eventId },
      'Billing webhook processed',
    );
  }

  private async applyWebhookEvent(
    gateway: PaymentGateway,
    event: WebhookEvent,
  ): Promise<void> {
    if (event.status === 'IGNORED') return;
    const row = await this.store.findByGatewayOrderId(gateway, event.gatewayOrderId);
    if (!row) {
      this.logger.warn(
        { event: 'billing_webhook_unknown_order', gateway, gatewayOrderId: event.gatewayOrderId },
        'Billing webhook references an unknown order',
      );
      return;
    }
    if (row.status === 'COMPLETED') {
      this.logger.info(
        { event: 'billing_webhook_duplicate', transactionId: row.id, gateway },
        'Duplicate billing webhook ignored',
      );
      return;
    }

    const metadata = {
      ...metadataObject(row),
      lastEventId: event.eventId,
      lastEventType: event.eventType,
    } as Prisma.InputJsonValue;

    if (event.status === 'FAILED') {
      await this.store.markStatus(row.id, 'FAILED', metadata);
      return;
    }

    const amountMismatch =
      event.amount != null && new Prisma.Decimal(event.amount).comparedTo(row.amount) !== 0;
    const currencyMismatch =
      event.currency != null && event.currency.toUpperCase() !== row.currency.toUpperCase();
    if (amountMismatch || currencyMismatch) {
      await this.store.markStatus(row.id, 'PENDING_APPROVAL', {
        ...(metadata as Record<string, unknown>),
        reviewReason: 'amount_mismatch',
      } as Prisma.InputJsonValue);
      return;
    }

    await this.store.completeTransaction({
      transactionId: row.id,
      durationDays: this.durationFor(row),
      metadata,
    });
  }
}
