import { Prisma } from '@foundly/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingConfig } from './billing.config';
import { ManualPaymentNotifier } from './manual-payment.notifier';
import { seedPaymentRow } from './billing.test-store';

describe('ManualPaymentNotifier', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok', { status: 200 })));
  });

  afterEach(() => {
    delete process.env.BILLING_ALERT_WEBHOOK_URL;
    vi.unstubAllGlobals();
  });

  it('posts an operational alert without sensitive card data', async () => {
    process.env.BILLING_ALERT_WEBHOOK_URL = 'https://alerts.example/hook';
    const notifier = new ManualPaymentNotifier(new BillingConfig());
    const row = seedPaymentRow({
      id: 'pay-alert',
      tenantId: 't1',
      referenceNumber: 'REF-999',
      amount: new Prisma.Decimal('29.99'),
    });

    await notifier.notifyPending(row);

    expect(fetch).toHaveBeenCalledOnce();
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((call?.[1] as RequestInit).body as string) as Record<string, unknown>;
    expect(body).toMatchObject({
      event: 'manual_payment_pending',
      transactionId: 'pay-alert',
      tenantId: 't1',
      referenceNumber: 'REF-999',
      amount: '29.99',
      currency: 'USD',
    });
    expect(JSON.stringify(body)).not.toContain('phone');
  });

  it('does nothing when no alert webhook is configured', async () => {
    const notifier = new ManualPaymentNotifier(new BillingConfig());
    await notifier.notifyPending(seedPaymentRow());
    expect(fetch).not.toHaveBeenCalled();
  });
});
