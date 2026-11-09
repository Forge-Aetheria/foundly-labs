import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';

describe('PaymentMethodSelector', () => {
  it('invokes each checkout action', async () => {
    const onPaypal = vi.fn();
    const onBinance = vi.fn();
    const onSelectManual = vi.fn();
    const user = userEvent.setup();
    render(
      <PaymentMethodSelector
        onPaypal={onPaypal}
        onBinance={onBinance}
        onSelectManual={onSelectManual}
      />,
    );

    await user.click(screen.getByRole('button', { name: /PayPal/i }));
    await user.click(screen.getByRole('button', { name: /Binance/i }));
    await user.click(screen.getByRole('button', { name: 'Pago Móvil' }));
    await user.click(screen.getByRole('button', { name: 'Transferencia' }));

    expect(onPaypal).toHaveBeenCalledOnce();
    expect(onBinance).toHaveBeenCalledOnce();
    expect(onSelectManual).toHaveBeenNthCalledWith(1, 'PAGO_MOVIL');
    expect(onSelectManual).toHaveBeenNthCalledWith(2, 'TRANSFERENCIA');
  });

  it('disables actions while a checkout is in flight', () => {
    render(
      <PaymentMethodSelector
        onPaypal={vi.fn()}
        onBinance={vi.fn()}
        onSelectManual={vi.fn()}
        busy
      />,
    );
    expect(screen.getByRole('button', { name: /PayPal/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Binance/i })).toBeDisabled();
  });
});
