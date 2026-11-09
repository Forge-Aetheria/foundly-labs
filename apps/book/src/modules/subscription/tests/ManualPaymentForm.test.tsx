import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { ManualPaymentForm } from '../components/ManualPaymentForm';

describe('ManualPaymentForm', () => {
  it('shows validation errors before calling onSubmit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ManualPaymentForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /Enviar pago/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/referencia es obligatoria/i)).toBeInTheDocument();
  });

  it('submits a valid manual payment', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ManualPaymentForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Número de referencia/i), 'REF-1');
    await user.type(screen.getByLabelText(/Banco emisor/i), 'Banesco');
    await user.type(screen.getByLabelText(/Monto transferido/i), '29.99');
    await user.type(screen.getByLabelText(/Teléfono del pago/i), '04120000');
    await user.click(screen.getByRole('button', { name: /Enviar pago/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      gateway: 'PAGO_MOVIL',
      referenceNumber: 'REF-1',
      bank: 'Banesco',
      amount: '29.99',
      currency: 'USD',
      phone: '04120000',
    });
  });

  it('shows a server-side duplicate reference inline', () => {
    renderWithProviders(
      <ManualPaymentForm
        onSubmit={vi.fn()}
        fieldErrors={{ referenceNumber: 'Esa referencia ya fue registrada.' }}
      />,
    );
    expect(screen.getByText(/ya fue registrada/i)).toBeInTheDocument();
  });
});
