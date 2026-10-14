import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ToastProvider } from '../../../shared/components/Toaster';
import { PaymentsConfig } from '../components/PaymentsConfig';

const { upsertMock } = vi.hoisted(() => ({ upsertMock: vi.fn() }));

vi.mock('../hooks', () => ({
  useUpsertPaymentMethod: () => upsertMock,
  useFetchPaymentMethods: () => vi.fn(),
  useDeletePaymentMethod: () => vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

describe('PaymentsConfig (feature 017, US1)', () => {
  beforeEach(() => {
    upsertMock.mockReset();
  });

  function renderConfig() {
    return render(
      <FoundlyThemeProvider>
        <ToastProvider>
          <PaymentsConfig methods={[]} />
        </ToastProvider>
      </FoundlyThemeProvider>,
    );
  }

  it('renders the three payment method cards', () => {
    renderConfig();
    expect(screen.getByText('Pago Móvil')).toBeInTheDocument();
    expect(screen.getByText('Transferencia bancaria')).toBeInTheDocument();
    expect(screen.getByText('Binance')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Guardar' })).toHaveLength(3);
  });

  it('saves a method (type + active) through the hook', async () => {
    upsertMock.mockResolvedValue({
      ok: true,
      data: {
        id: 'pm1',
        tenantId: 'ten-ana',
        type: 'mobile_payment',
        label: null,
        details: '',
        instructions: '',
        active: true,
      },
    });
    const user = userEvent.setup();
    renderConfig();

    await user.click(screen.getAllByRole('checkbox')[0]!);
    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]!);

    expect(upsertMock).toHaveBeenCalledWith({
      type: 'mobile_payment',
      active: true,
      details: '',
      instructions: '',
    });
    expect(await screen.findByText('Pago Móvil guardado.')).toBeInTheDocument();
  });
});
