import type { PaymentGateway } from '../billing.types';
import type { SubscriptionPlan } from '../../subscription/subscription.types';

export interface CheckoutInput {
  transactionId: string;
  tenantId: string;
  plan: SubscriptionPlan;
  amount: string;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  gatewayOrderId: string;
  checkoutUrl?: string | null;
  token?: string | null;
  metadata?: Record<string, unknown>;
}

export type WebhookEventStatus = 'COMPLETED' | 'FAILED' | 'IGNORED';

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  gatewayOrderId: string;
  status: WebhookEventStatus;
  amount?: string | null;
  currency?: string | null;
  metadata?: Record<string, unknown>;
}

/** Thrown when a provider callback cannot be authenticated. Controller maps it to HTTP 401. */
export class WebhookVerificationError extends Error {
  constructor(message = 'Invalid webhook signature') {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

export interface PaymentProvider {
  readonly gateway: PaymentGateway;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookEvent>;
}

export const PAYPAL_PROVIDER = Symbol('PAYPAL_PROVIDER');
export const BINANCE_PROVIDER = Symbol('BINANCE_PROVIDER');
