import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { PaymentHistoryList } from '../components/PaymentHistoryList';
import type { PaymentTransactionView } from '../utils/types';

const items: PaymentTransactionView[] = [
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
  {
    id: 'p2',
    gateway: 'PAYPAL',
    status: 'COMPLETED',
    plan: 'PRO',
    amount: '29.99',
    currency: 'USD',
    gatewayOrderId: 'I-1',
    referenceNumber: null,
    expiresAt: '2027-01-01T00:00:00.000Z',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

describe('PaymentHistoryList', () => {
  it('renders transactions with translated statuses', () => {
    renderWithProviders(<PaymentHistoryList items={items} />);
    expect(screen.getByText(/Pendiente de aprobación/i)).toBeInTheDocument();
    expect(screen.getByText(/Completado/i)).toBeInTheDocument();
    expect(screen.getByText(/REF-1/)).toBeInTheDocument();
    expect(screen.getByText(/PayPal/i)).toBeInTheDocument();
  });

  it('shows the empty state and load more action', async () => {
    const onLoadMore = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<PaymentHistoryList items={[]} />);
    expect(screen.getByText(/Aún no tienes pagos/i)).toBeInTheDocument();

    rerender(<PaymentHistoryList items={items} hasMore onLoadMore={onLoadMore} />);
    await user.click(screen.getByRole('button', { name: /Cargar más/i }));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });
});
