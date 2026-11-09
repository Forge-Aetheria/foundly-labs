import { beforeEach, describe, expect, it } from 'vitest';
import { BillingConfig } from './billing.config';
import { BillingService } from './billing.service';
import { createMemoryBillingStore } from './billing.test-store';
import type { ManualPaymentNotifier } from './manual-payment.notifier';
import type { PaymentProvider } from './providers/payment-provider';

const provider: PaymentProvider = {
  gateway: 'PAYPAL',
  createCheckout: async () => ({ gatewayOrderId: 'x' }),
  verifyWebhook: async () => ({
    eventId: 'x',
    eventType: 'x',
    gatewayOrderId: 'x',
    status: 'IGNORED',
  }),
};

describe('BillingService.getInstructions', () => {
  beforeEach(() => {
    process.env.BILLING_PRO_AMOUNT_USD = '29.99';
    process.env.BILLING_PRO_DURATION_DAYS = '30';
    process.env.BILLING_MANUAL_BANK = 'Banesco';
    process.env.BILLING_MANUAL_CEDULA = 'V-12345678';
    process.env.BILLING_MANUAL_PHONE = '+58 412 000 0000';
    process.env.BILLING_MANUAL_RATE_VES_PER_USD = '40.00';
    process.env.BILLING_MANUAL_NOTE = 'Envía el comprobante';
  });

  it('returns plan and manual instructions from server config', () => {
    const service = new BillingService(
      createMemoryBillingStore(),
      new BillingConfig(),
      provider,
      provider,
      { notifyPending: async () => undefined } as unknown as ManualPaymentNotifier,
    );
    expect(service.getInstructions()).toEqual({
      plan: { amount: '29.99', currency: 'USD', durationDays: 30 },
      manual: {
        bank: 'Banesco',
        cedula: 'V-12345678',
        phone: '+58 412 000 0000',
        rateVesPerUsd: '40.00',
        note: 'Envía el comprobante',
      },
    });
  });

  it('fails closed when manual instructions are incomplete', () => {
    delete process.env.BILLING_MANUAL_BANK;
    const service = new BillingService(
      createMemoryBillingStore(),
      new BillingConfig(),
      provider,
      provider,
      { notifyPending: async () => undefined } as unknown as ManualPaymentNotifier,
    );
    expect(() => service.getInstructions()).toThrowError(
      expect.objectContaining({ extensions: { code: 'STATE_ERROR' } }),
    );
  });
});
