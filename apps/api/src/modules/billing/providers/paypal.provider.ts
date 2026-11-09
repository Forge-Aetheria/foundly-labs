import { Injectable } from '@nestjs/common';
import { BillingConfig } from '../billing.config';
import { paymentProviderError } from '../billing.errors';
import type { PaymentGateway } from '../billing.types';
import {
  WebhookVerificationError,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
  type WebhookEvent,
  type WebhookEventStatus,
} from './payment-provider';

interface PaypalTokenResponse {
  access_token?: string;
}

interface PaypalLink {
  rel?: string;
  href?: string;
}

interface PaypalEvent {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    billing_agreement_id?: string;
    amount?: { total?: string; currency?: string };
    supplementary_data?: { related_ids?: { subscription_id?: string } };
  };
}

function header(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function mapStatus(eventType: string): WebhookEventStatus {
  if (
    eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
    eventType === 'PAYMENT.SALE.COMPLETED'
  ) {
    return 'COMPLETED';
  }
  if (
    eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED' ||
    eventType === 'PAYMENT.SALE.DENIED'
  ) {
    return 'FAILED';
  }
  return 'IGNORED';
}

@Injectable()
export class PaypalProvider implements PaymentProvider {
  readonly gateway: PaymentGateway = 'PAYPAL';

  constructor(private readonly config: BillingConfig) {}

  private async accessToken(): Promise<string> {
    const cfg = this.config.paypal();
    const credentials = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
    const response = await fetch(`${cfg.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw paymentProviderError('PayPal authentication failed');
    }
    const body = (await response.json()) as PaypalTokenResponse;
    if (!body.access_token) {
      throw paymentProviderError('PayPal authentication failed');
    }
    return body.access_token;
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const cfg = this.config.paypal();
    const token = await this.accessToken();
    const response = await fetch(`${cfg.baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: cfg.planId,
        custom_id: input.transactionId,
        application_context: {
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
          user_action: 'SUBSCRIBE_NOW',
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw paymentProviderError('PayPal order creation failed');
    }
    const body = (await response.json()) as { id?: string; links?: PaypalLink[] };
    if (!body.id) {
      throw paymentProviderError('PayPal order creation failed');
    }
    const approval = body.links?.find((link) => link.rel === 'approve')?.href ?? null;
    return {
      gatewayOrderId: body.id,
      checkoutUrl: approval,
      metadata: { subscriptionId: body.id },
    };
  }

  async verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookEvent> {
    const cfg = this.config.paypal();
    const token = await this.accessToken();
    const event = JSON.parse(rawBody.toString('utf8')) as PaypalEvent;
    const verification = await fetch(`${cfg.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: header(headers, 'paypal-auth-algo'),
        cert_url: header(headers, 'paypal-cert-url'),
        transmission_id: header(headers, 'paypal-transmission-id'),
        transmission_sig: header(headers, 'paypal-transmission-sig'),
        transmission_time: header(headers, 'paypal-transmission-time'),
        webhook_id: cfg.webhookId,
        webhook_event: event,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!verification.ok) {
      throw new WebhookVerificationError('PayPal webhook verification failed');
    }
    const verified = (await verification.json()) as { verification_status?: string };
    if (verified.verification_status !== 'SUCCESS') {
      throw new WebhookVerificationError('PayPal webhook signature is invalid');
    }

    const eventType = event.event_type ?? '';
    const gatewayOrderId =
      event.resource?.billing_agreement_id ??
      event.resource?.supplementary_data?.related_ids?.subscription_id ??
      event.resource?.id ??
      '';
    if (!gatewayOrderId) {
      throw new WebhookVerificationError('PayPal webhook has no order reference');
    }
    return {
      eventId: event.id ?? `${eventType}:${gatewayOrderId}`,
      eventType,
      gatewayOrderId,
      status: mapStatus(eventType),
      amount: event.resource?.amount?.total ?? null,
      currency: event.resource?.amount?.currency ?? null,
      metadata: { eventType },
    };
  }
}
