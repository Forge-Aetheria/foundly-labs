import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
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

interface BinanceOrderResponse {
  status?: string;
  data?: {
    prepayId?: string;
    checkoutUrl?: string;
    universalUrl?: string;
    qrcodeLink?: string;
  };
}

interface BinanceEvent {
  bizId?: string;
  bizStatus?: string;
  tradeStatus?: string;
  merchantTradeNo?: string;
  prepayId?: string;
  orderAmount?: string;
  currency?: string;
}

function header(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function signPayload(secret: string, timestamp: string, nonce: string, body: string): string {
  return createHmac('sha512', secret)
    .update(`${timestamp}\n${nonce}\n${body}\n`)
    .digest('hex');
}

function mapStatus(event: BinanceEvent): WebhookEventStatus {
  const value = (event.bizStatus ?? event.tradeStatus ?? '').toUpperCase();
  if (value === 'PAYMENT_SUCCESS' || value === 'SUCCESS' || value === 'PAID') {
    return 'COMPLETED';
  }
  if (value === 'PAYMENT_FAILED' || value === 'PAYMENT_CLOSED' || value === 'FAILED') {
    return 'FAILED';
  }
  return 'IGNORED';
}

@Injectable()
export class BinanceProvider implements PaymentProvider {
  readonly gateway: PaymentGateway = 'BINANCE';

  constructor(private readonly config: BillingConfig) {}

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const cfg = this.config.binance();
    const merchantTradeNo = `BT${input.transactionId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
    const body = JSON.stringify({
      env: { terminalType: 'WEB' },
      merchantTradeNo,
      orderAmount: input.amount,
      currency: input.currency,
      goods: {
        goodsType: '02',
        goodsCategory: 'Z000',
        referenceGoodsId: input.plan,
        goodsName: 'Foundly Book Pro',
      },
    });
    const timestamp = Date.now().toString();
    const nonce = randomBytes(16).toString('hex');
    const signature = signPayload(cfg.apiSecret, timestamp, nonce, body);

    const response = await fetch(`${cfg.baseUrl}/binancepay/openapi/v3/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': cfg.apiKey,
        'BinancePay-Signature': signature,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw paymentProviderError('Binance Pay order creation failed');
    }
    const payload = (await response.json()) as BinanceOrderResponse;
    if (payload.status !== 'SUCCESS' || !payload.data) {
      throw paymentProviderError('Binance Pay order creation failed');
    }
    const data = payload.data;
    return {
      gatewayOrderId: merchantTradeNo,
      checkoutUrl: data.universalUrl ?? data.checkoutUrl ?? data.qrcodeLink ?? null,
      metadata: { prepayId: data.prepayId ?? null },
    };
  }

  async verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookEvent> {
    const cfg = this.config.binance();
    const timestamp = header(headers, 'binancepay-timestamp');
    const nonce = header(headers, 'binancepay-nonce');
    const signature = header(headers, 'binancepay-signature');
    if (!timestamp || !nonce || !signature) {
      throw new WebhookVerificationError('Missing Binance Pay signature headers');
    }
    const expected = signPayload(cfg.webhookSecret, timestamp, nonce, rawBody.toString('utf8'));
    const providedBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new WebhookVerificationError('Invalid Binance Pay signature');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as BinanceEvent;
    const gatewayOrderId = event.merchantTradeNo ?? event.prepayId ?? '';
    if (!gatewayOrderId) {
      throw new WebhookVerificationError('Binance Pay webhook has no order reference');
    }
    return {
      eventId: event.bizId ?? `${event.bizStatus ?? 'event'}:${gatewayOrderId}`,
      eventType: event.bizStatus ?? event.tradeStatus ?? 'UNKNOWN',
      gatewayOrderId,
      status: mapStatus(event),
      amount: event.orderAmount ?? null,
      currency: event.currency ?? null,
      metadata: { prepayId: event.prepayId ?? null },
    };
  }
}
