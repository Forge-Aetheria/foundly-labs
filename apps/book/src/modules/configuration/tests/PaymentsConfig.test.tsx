import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ToastProvider } from '../../../shared/components/Toaster';
import type { PaymentMethod } from '../../../shared/types/payments';
import { PaymentsConfig } from '../components/PaymentsConfig';

const { upsertMock, deleteMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useUpsertPaymentMethod: () => upsertMock,
  useDeletePaymentMethod: () => deleteMock,
  useFetchPaymentMethods: () => vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const method: PaymentMethod = {
  id: 'pm1',
  tenantId: 'ten-ana',
  type: 'pago_movil',
  title: 'Pago Móvil Banesco',
  details: { holder: 'Ana', cedula: 'V-123', phone: '0412', bank: 'Banesco' },
  instructions: null,
  active: true,
};

function renderConfig(methods: PaymentMethod[] = []) {
  return render(
    <FoundlyThemeProvider>
      <ToastProvider>
        <PaymentsConfig methods={methods} />
      </ToastProvider>
    </FoundlyThemeProvider>,
  );
}

describe('PaymentsConfig (features 017/022)', () => {
  beforeEach(() => {
    upsertMock.mockReset();
    deleteMock.mockReset();
  });

  it('shows an empty state with the new-method CTA', () => {
    renderConfig();
    expect(screen.getByText('Métodos de pago')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay métodos de pago')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Nuevo Método de Pago' })).toBeInTheDocument();
  });

  it('renders a configured method card with its structured summary and badge', () => {
    renderConfig([method]);
    expect(screen.getByText('Pago Móvil Banesco')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText(/Banco: Banesco/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  it('creates a method through the modal with structured details', async () => {
    upsertMock.mockResolvedValue({
      ok: true,
      data: { ...method, title: 'Pago Móvil BdV', details: { bank: 'BdV' } },
    });
    const user = userEvent.setup();
    renderConfig();

    await user.click(screen.getByRole('button', { name: '+ Nuevo Método de Pago' }));
    await user.type(screen.getByLabelText('Título'), 'Pago Móvil BdV');
    await user.type(screen.getByLabelText('Banco'), 'BdV');
    await user.click(screen.getByRole('button', { name: 'Guardar método' }));

    expect(upsertMock).toHaveBeenCalledWith({
      type: 'pago_movil',
      title: 'Pago Móvil BdV',
      details: { bank: 'BdV' },
      instructions: '',
      active: true,
    });
    expect(await screen.findByText('Pago Móvil guardado.')).toBeInTheDocument();
  });

  it('toggles a method active state preserving its data', async () => {
    upsertMock.mockResolvedValue({ ok: true, data: { ...method, active: false } });
    const user = userEvent.setup();
    renderConfig([method]);

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));

    await waitFor(() =>
      expect(upsertMock).toHaveBeenCalledWith({
        type: 'pago_movil',
        title: 'Pago Móvil Banesco',
        details: method.details,
        instructions: '',
        active: false,
      }),
    );
  });

  it('deletes a method after confirming the dialog', async () => {
    deleteMock.mockResolvedValue({ ok: true, data: { id: 'pm1' } });
    const user = userEvent.setup();
    renderConfig([method]);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(deleteMock).toHaveBeenCalledWith({ id: 'pm1' });
    expect(await screen.findByText('Pago Móvil eliminado.')).toBeInTheDocument();
  });
});
