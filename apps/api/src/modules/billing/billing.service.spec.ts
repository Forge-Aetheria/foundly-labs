import { Prisma } from '@foundly/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.types';
import { BillingConfig } from './billing.config';
import { BillingService } from './billing.service';
import { createMemoryBillingStore, seedPaymentRow } from './billing.test-store';
import { ManualPaymentNotifier } from './manual-payment.notifier';
import type { PaymentProvider } from './providers/payment-provider';

const user: AuthUser = {
  sub: 'user-1',
  role: 'authenticated',
  aud: 'authenticated',
  exp: 9999999999,
  tenantId: 't1',
};

function provider(gateway: 'PAYPAL' | 'BINANCE'): PaymentProvider {
  return {
    gateway,
    createCheckout: vi.fn(async () => ({
      gatewayOrderId: `${gateway}-ORDER`,
      checkoutUrl: `https://pay.example/${gateway}`,
    })),
    verifyWebhook: vi.fn(),
  };
}

describe('BillingService', () => {
  let store: ReturnType<typeof createMemoryBillingStore>;
  let config: BillingConfig;
  let paypal: PaymentProvider;
  let binance: PaymentProvider;
  let notifier: { notifyPending: ReturnType<typeof vi.fn> };
  let service: BillingService;

  beforeEach(() => {
    process.env.BILLING_PRO_AMOUNT_USD = '29.99';
    process.env.BILLING_PRO_DURATION_DAYS = '30';
    process.env.BILLING_CHECKOUT_RETURN_URL = 'http://localhost:3001/return';
    process.env.BILLING_CHECKOUT_CANCEL_URL = 'http://localhost:3001/cancel';
    delete process.env.BILLING_ALERT_WEBHOOK_URL;
    store = createMemoryBillingStore();
    config = new BillingConfig();
    paypal = provider('PAYPAL');
    binance = provider('BINANCE');
    notifier = { notifyPending: vi.fn(async () => undefined) };
    service = new BillingService(
      store,
      config,
      paypal,
      binance,
      notifier as unknown as ManualPaymentNotifier,
    );
  });

  it('creates a PayPal checkout as a pending transaction', async () => {
    const checkout = await service.createPaypalSubscriptionOrder(user);
    expect(checkout.gateway).toBe('PAYPAL');
    expect(checkout.checkoutUrl).toContain('PAYPAL');
    expect(checkout.gatewayOrderId).toBe('PAYPAL-ORDER');

    const row = await store.findByGatewayOrderId('PAYPAL', 'PAYPAL-ORDER');
    expect(row?.status).toBe('PENDING');
    expect(row?.amount.toString()).toBe('29.99');
    expect(row?.currency).toBe('USD');
    expect(paypal.createCheckout).toHaveBeenCalledOnce();
  });

  it('completes a provider webhook and extends the tenant subscription', async () => {
    await service.createPaypalSubscriptionOrder(user);
    (paypal.verifyWebhook as ReturnType<typeof vi.fn>).mockResolvedValue({
      eventId: 'evt-1',
      eventType: 'BILLING.SUBSCRIPTION.ACTIVATED',
      gatewayOrderId: 'PAYPAL-ORDER',
      status: 'COMPLETED',
      amount: '29.99',
      currency: 'USD',
    });

    await service.handleWebhook('PAYPAL', Buffer.from('{}'), {});
    const row = await store.findByGatewayOrderId('PAYPAL', 'PAYPAL-ORDER');
    expect(row?.status).toBe('COMPLETED');
    expect(row?.expiresAt).toBeTruthy();
    const firstExpiry = store.getTenantExpiry('t1')?.getTime();

    await service.handleWebhook('PAYPAL', Buffer.from('{}'), {});
    expect(store.getTenantExpiry('t1')?.getTime()).toBe(firstExpiry);
  });

  it('marks a failed provider event without granting Pro', async () => {
    await service.createBinancePaymentOrder(user);
    (binance.verifyWebhook as ReturnType<typeof vi.fn>).mockResolvedValue({
      eventId: 'evt-fail',
      eventType: 'PAYMENT_FAILED',
      gatewayOrderId: 'BINANCE-ORDER',
      status: 'FAILED',
    });

    await service.handleWebhook('BINANCE', Buffer.from('{}'), {});
    const row = await store.findByGatewayOrderId('BINANCE', 'BINANCE-ORDER');
    expect(row?.status).toBe('FAILED');
    expect(store.getTenantExpiry('t1')).toBeNull();
  });

  it('ignores unsupported provider events', async () => {
    await service.createBinancePaymentOrder(user);
    (binance.verifyWebhook as ReturnType<typeof vi.fn>).mockResolvedValue({
      eventId: 'evt-ignored',
      eventType: 'SOMETHING_ELSE',
      gatewayOrderId: 'BINANCE-ORDER',
      status: 'IGNORED',
    });

    await service.handleWebhook('BINANCE', Buffer.from('{}'), {});
    const row = await store.findByGatewayOrderId('BINANCE', 'BINANCE-ORDER');
    expect(row?.status).toBe('PENDING');
    expect(store.getTenantExpiry('t1')).toBeNull();
  });

  it('leaves an amount mismatch for review instead of activating', async () => {
    await service.createBinancePaymentOrder(user);
    (binance.verifyWebhook as ReturnType<typeof vi.fn>).mockResolvedValue({
      eventId: 'evt-mismatch',
      eventType: 'PAYMENT_SUCCESS',
      gatewayOrderId: 'BINANCE-ORDER',
      status: 'COMPLETED',
      amount: '10.00',
      currency: 'USD',
    });

    await service.handleWebhook('BINANCE', Buffer.from('{}'), {});
    const row = await store.findByGatewayOrderId('BINANCE', 'BINANCE-ORDER');
    expect(row?.status).toBe('PENDING_APPROVAL');
    expect(store.getTenantExpiry('t1')).toBeNull();
  });

  it('registers a manual payment as pending without activating', async () => {
    const result = await service.submitManualPayment(user, {
      gateway: 'PAGO_MOVIL',
      referenceNumber: 'REF-123',
      bank: 'Banesco',
      amount: '29.99',
      currency: 'usd',
      phone: '+58 412 000 0000',
    });

    expect(result.status).toBe('PENDING_APPROVAL');
    expect(result.amount).toBe('29.99');
    expect(result.currency).toBe('USD');
    expect(store.getTenantExpiry('t1')).toBeNull();
    expect(notifier.notifyPending).toHaveBeenCalledOnce();
  });

  it('rejects a duplicate manual reference', async () => {
    const input = {
      gateway: 'PAGO_MOVIL' as const,
      referenceNumber: 'REF-123',
      bank: 'Banesco',
      amount: '29.99',
      currency: 'USD',
      phone: '+58 412 000 0000',
    };
    await service.submitManualPayment(user, input);
    await expect(service.submitManualPayment(user, input)).rejects.toMatchObject({
      extensions: { code: 'PAYMENT_DUPLICATE_REFERENCE' },
    });
  });

  it('approves a manual payment atomically and idempotently', async () => {
    const submitted = await service.submitManualPayment(user, {
      gateway: 'TRANSFERENCIA',
      referenceNumber: 'REF-456',
      bank: 'Mercantil',
      amount: '29.99',
      currency: 'USD',
      phone: '+58 412 000 0001',
    });

    const approved = await service.approveManualPayment(user, submitted.id);
    expect(approved.status).toBe('COMPLETED');
    const firstExpiry = store.getTenantExpiry('t1')?.getTime();

    const again = await service.approveManualPayment(user, submitted.id);
    expect(again.status).toBe('COMPLETED');
    expect(store.getTenantExpiry('t1')?.getTime()).toBe(firstExpiry);
  });

  it('rejects approving a non-pending manual payment', async () => {
    store.seed(seedPaymentRow({ id: 'pay-rejected', status: 'REJECTED' }));
    await expect(service.approveManualPayment(user, 'pay-rejected')).rejects.toMatchObject({
      extensions: { code: 'PAYMENT_NOT_PENDING' },
    });
  });

  it('lists only the caller tenant transactions', async () => {
    store.seed(seedPaymentRow({ id: 'a', tenantId: 't1' }));
    store.seed(seedPaymentRow({ id: 'b', tenantId: 't2' }));
    const rows = await service.listTransactions(user);
    expect(rows.map((row) => row.id)).toEqual(['a']);
  });

  it('rejects a payment without tenant scope', async () => {
    await expect(
      service.submitManualPayment(
        {},
        {
          gateway: 'PAGO_MOVIL',
          referenceNumber: 'REF',
          bank: 'Banesco',
          amount: '1',
          currency: 'USD',
          phone: '123',
        },
      ),
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });

  it('does not trust a client amount for automated orders', async () => {
    const checkout = await service.createPaypalSubscriptionOrder(user);
    const row = await store.findById(checkout.transactionId);
    expect(row?.amount.toString()).toBe(new Prisma.Decimal('29.99').toString());
  });
});
