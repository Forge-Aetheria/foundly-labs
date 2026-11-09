import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import type { BillingInstructionsView, PaymentTransactionView, SubscriptionSummaryView } from '../utils/types';

const h = vi.hoisted(() => ({
  subscription: null as SubscriptionSummaryView | null,
  instructions: null as BillingInstructionsView | null,
  transactions: [] as PaymentTransactionView[],
}));

vi.mock('../hooks', () => ({
  useSubscription: () => ({
    data: h.subscription,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useBillingInstructions: () => ({
    data: h.instructions,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePaymentTransactions: () => ({
    items: h.transactions,
    isLoading: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    loadMore: vi.fn(),
  }),
  useCreatePaypalOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateBinanceOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubmitManualPayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBillingRefresh: () => vi.fn(),
}));

import { SubscriptionView } from '../SubscriptionView';

const free: SubscriptionSummaryView = {
  plan: 'FREE',
  effectivePlan: 'FREE',
  status: 'active',
  expiresAt: null,
  limits: {
    services: { used: 1, limit: 1, unlimited: false },
    team: { used: 1, limit: 1, unlimited: false },
  },
};

const instructions: BillingInstructionsView = {
  plan: { amount: '29.99', currency: 'USD', durationDays: 30 },
  manual: {
    bank: 'Banesco',
    cedula: 'V-123',
    phone: '0412',
    rateVesPerUsd: '40.00',
    note: null,
  },
};

describe('SubscriptionView', () => {
  it('shows the Free plan and usage', () => {
    h.subscription = free;
    h.instructions = instructions;
    h.transactions = [];
    renderWithProviders(<SubscriptionView />, { router: { initialEntries: ['/admin/configuracion?tab=suscripcion'] } });
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getAllByText('1 / 1')).toHaveLength(2);
  });

  it('shows the Pro plan as unlimited', () => {
    h.subscription = {
      ...free,
      plan: 'PRO',
      effectivePlan: 'PRO',
      limits: {
        services: { used: 4, limit: 0, unlimited: true },
        team: { used: 2, limit: 0, unlimited: true },
      },
    };
    h.instructions = instructions;
    h.transactions = [];
    renderWithProviders(<SubscriptionView />, { router: { initialEntries: ['/admin/configuracion?tab=suscripcion'] } });
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getAllByText('Ilimitado').length).toBeGreaterThan(0);
  });

  it('has no critical accessibility violations', async () => {
    h.subscription = free;
    h.instructions = instructions;
    h.transactions = [];
    const { container } = renderWithProviders(<SubscriptionView />, {
      router: { initialEntries: ['/admin/configuracion?tab=suscripcion'] },
    });
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('shows a pending payment and opens the manual form', async () => {
    h.subscription = free;
    h.instructions = instructions;
    h.transactions = [
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
    ];
    const user = userEvent.setup();
    renderWithProviders(<SubscriptionView />, { router: { initialEntries: ['/admin/configuracion?tab=suscripcion'] } });

    expect(screen.getByText(/Pendiente de aprobación/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pago Móvil' }));
    expect(screen.getByText(/Datos para Pago Móvil/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar pago/i })).toBeInTheDocument();
  });
});
