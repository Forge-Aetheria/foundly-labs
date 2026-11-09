import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.types';
import { BillingResolver } from './billing.resolver';
import type { BillingService } from './billing.service';

const user: AuthUser = {
  sub: 'u1',
  role: 'authenticated',
  aud: 'authenticated',
  exp: 0,
  tenantId: 't1',
};

describe('BillingResolver', () => {
  const service = {
    createPaypalSubscriptionOrder: vi.fn(async () => ({ transactionId: 'p1' })),
    createBinancePaymentOrder: vi.fn(async () => ({ transactionId: 'p2' })),
    submitManualPayment: vi.fn(async () => ({ id: 'p3' })),
    approveManualPayment: vi.fn(async () => ({ id: 'p3' })),
    listTransactions: vi.fn(async () => []),
  };
  let resolver: BillingResolver;

  beforeEach(() => {
    vi.clearAllMocks();
    resolver = new BillingResolver(service as unknown as BillingService);
  });

  it('delegates checkout creation with the authenticated user', async () => {
    await resolver.createPaypalSubscriptionOrder(user);
    expect(service.createPaypalSubscriptionOrder).toHaveBeenCalledWith(user);

    await resolver.createBinancePaymentOrder(user);
    expect(service.createBinancePaymentOrder).toHaveBeenCalledWith(user);
  });

  it('delegates manual submission and history with tenant scope', async () => {
    const input = {
      gateway: 'PAGO_MOVIL' as const,
      referenceNumber: 'REF',
      bank: 'Banesco',
      amount: '1.00',
      currency: 'USD',
      phone: '123',
    };
    await resolver.submitManualPayment(user, input);
    expect(service.submitManualPayment).toHaveBeenCalledWith(user, input);

    await resolver.myPaymentTransactions(user, 10, 0);
    expect(service.listTransactions).toHaveBeenCalledWith(user, 10, 0);
  });

  it('delegates manual approval', async () => {
    await resolver.approveManualPayment(user, 'p3');
    expect(service.approveManualPayment).toHaveBeenCalledWith(user, 'p3');
  });
});
