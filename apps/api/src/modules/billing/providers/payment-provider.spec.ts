import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingConfig } from '../billing.config';
import { BinanceProvider } from './binance.provider';
import { PaypalProvider } from './paypal.provider';
import { WebhookVerificationError } from './payment-provider';

describe('billing providers', () => {
  beforeEach(() => {
    process.env.PAYPAL_CLIENT_ID = 'client';
    process.env.PAYPAL_CLIENT_SECRET = 'secret';
    process.env.PAYPAL_PLAN_ID = 'P-1';
    process.env.PAYPAL_WEBHOOK_ID = 'WH-1';
    process.env.BINANCE_PAY_API_KEY = 'key';
    process.env.BINANCE_PAY_API_SECRET = 'binance-secret';
    process.env.BINANCE_PAY_WEBHOOK_SECRET = 'binance-secret';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_SECRET;
    delete process.env.PAYPAL_PLAN_ID;
    delete process.env.PAYPAL_WEBHOOK_ID;
    delete process.env.BINANCE_PAY_API_KEY;
    delete process.env.BINANCE_PAY_API_SECRET;
    delete process.env.BINANCE_PAY_WEBHOOK_SECRET;
    vi.unstubAllGlobals();
  });

  it('creates a PayPal subscription checkout', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'token' }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'I-123',
            links: [{ rel: 'approve', href: 'https://paypal.example/approve' }],
          }),
          { status: 200 },
        ),
      );
    const provider = new PaypalProvider(new BillingConfig());
    const checkout = await provider.createCheckout({
      transactionId: 'pay-1',
      tenantId: 't1',
      plan: 'PRO',
      amount: '29.99',
      currency: 'USD',
      returnUrl: 'http://return',
      cancelUrl: 'http://cancel',
    });
    expect(checkout.gatewayOrderId).toBe('I-123');
    expect(checkout.checkoutUrl).toBe('https://paypal.example/approve');
  });

  it('accepts a valid Binance Pay webhook signature', async () => {
    const provider = new BinanceProvider(new BillingConfig());
    const body = JSON.stringify({
      bizId: 'biz-1',
      bizStatus: 'PAYMENT_SUCCESS',
      merchantTradeNo: 'BT1',
      orderAmount: '29.99',
      currency: 'USD',
    });
    const timestamp = '1700000000000';
    const nonce = 'abc';
    const signature = createHmac('sha512', 'binance-secret')
      .update(`${timestamp}\n${nonce}\n${body}\n`)
      .digest('hex');

    const event = await provider.verifyWebhook(Buffer.from(body), {
      'binancepay-timestamp': timestamp,
      'binancepay-nonce': nonce,
      'binancepay-signature': signature,
    });
    expect(event).toMatchObject({
      gatewayOrderId: 'BT1',
      status: 'COMPLETED',
      amount: '29.99',
      currency: 'USD',
    });
  });

  it('rejects a Binance Pay webhook with an invalid signature', async () => {
    const provider = new BinanceProvider(new BillingConfig());
    await expect(
      provider.verifyWebhook(Buffer.from('{}'), {
        'binancepay-timestamp': '1',
        'binancepay-nonce': 'n',
        'binancepay-signature': 'bad',
      }),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
  });
});
