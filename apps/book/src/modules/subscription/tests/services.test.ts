import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BillingInstructionsDocument,
  CreateBinancePaymentOrderDocument,
  CreatePaypalSubscriptionOrderDocument,
  MyPaymentTransactionsDocument,
  MySubscriptionDocument,
  SubmitManualPaymentDocument,
} from '../../../shared/api/generated';
import {
  createBinanceOrder,
  createPaypalOrder,
  getBillingInstructions,
  getSubscription,
  listPaymentTransactions,
  submitManualPayment,
} from '../services';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock('../../../shared/api/authed-request', () => ({
  apiRequestAuthed: (...args: unknown[]) => apiMock(...args),
}));

describe('subscription services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps the subscription summary and usage', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: {
        mySubscription: {
          plan: 'PRO',
          effectivePlan: 'PRO',
          status: 'active',
          expiresAt: '2027-01-01T00:00:00.000Z',
          limits: {
            services: { used: 3, limit: 0, unlimited: true },
            team: { used: 2, limit: 0, unlimited: true },
          },
        },
      },
    });
    const result = await getSubscription();
    expect(apiMock).toHaveBeenCalledWith(MySubscriptionDocument, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.effectivePlan).toBe('PRO');
      expect(result.data.limits.services.unlimited).toBe(true);
    }
  });

  it('maps billing instructions', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: {
        billingInstructions: {
          plan: { amount: '29.99', currency: 'USD', durationDays: 30 },
          manual: {
            bank: 'Banesco',
            cedula: 'V-123',
            phone: '04120000',
            rateVesPerUsd: '40.00',
            note: null,
          },
        },
      },
    });
    const result = await getBillingInstructions();
    expect(apiMock).toHaveBeenCalledWith(BillingInstructionsDocument, {});
    expect(result.ok && result.data.plan.amount).toBe('29.99');
  });

  it('creates checkout orders for PayPal and Binance', async () => {
    apiMock
      .mockResolvedValueOnce({
        ok: true,
        data: {
          createPaypalSubscriptionOrder: {
            transactionId: 'p1',
            gateway: 'PAYPAL',
            checkoutUrl: 'https://paypal.example',
            token: null,
            gatewayOrderId: 'I-1',
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          createBinancePaymentOrder: {
            transactionId: 'p2',
            gateway: 'BINANCE',
            checkoutUrl: 'https://binance.example',
            token: null,
            gatewayOrderId: 'BT2',
          },
        },
      });

    const paypal = await createPaypalOrder();
    const binance = await createBinanceOrder();
    expect(apiMock).toHaveBeenNthCalledWith(1, CreatePaypalSubscriptionOrderDocument, {});
    expect(apiMock).toHaveBeenNthCalledWith(2, CreateBinancePaymentOrderDocument, {});
    expect(paypal.ok && paypal.data.checkoutUrl).toBe('https://paypal.example');
    expect(binance.ok && binance.data.gatewayOrderId).toBe('BT2');
  });

  it('lists transactions and maps gateway/status', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: {
        myPaymentTransactions: [
          {
            id: 'p1',
            gateway: 'PAGO_MOVIL',
            status: 'PENDING_APPROVAL',
            plan: 'PRO',
            amount: '29.99',
            currency: 'USD',
            gatewayOrderId: null,
            referenceNumber: 'REF-1',
            expiresAt: null,
            createdAt: '2026-11-09T00:00:00.000Z',
            updatedAt: '2026-11-09T00:00:00.000Z',
          },
        ],
      },
    });
    const result = await listPaymentTransactions(10, 0);
    expect(apiMock).toHaveBeenCalledWith(MyPaymentTransactionsDocument, { limit: 10, offset: 0 });
    expect(result.ok && result.data[0]?.status).toBe('PENDING_APPROVAL');
  });

  it('validates manual payments before calling the API', async () => {
    const result = await submitManualPayment({
      gateway: 'PAGO_MOVIL',
      referenceNumber: '',
      bank: '',
      amount: '0',
      currency: 'USD',
      phone: '',
    });
    expect(result.ok).toBe(false);
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('maps a duplicate reference to an inline field error', async () => {
    apiMock.mockResolvedValue({
      ok: false,
      error: { code: 'PAYMENT_DUPLICATE_REFERENCE', message: 'duplicated' },
    });
    const result = await submitManualPayment({
      gateway: 'PAGO_MOVIL',
      referenceNumber: 'REF-1',
      bank: 'Banesco',
      amount: '29.99',
      currency: 'USD',
      phone: '04120000',
    });
    expect(apiMock).toHaveBeenCalledWith(SubmitManualPaymentDocument, expect.any(Object));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.fields?.referenceNumber).toBeTruthy();
  });
});
