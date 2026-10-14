import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ToastProvider } from '../../../shared/components/Toaster';
import type { Resource, Service } from '../../../shared/types/appointments';
import { Agenda, type AgendaProps, type AgendaRow } from '../components/Agenda';

const { createMock, statusMock, cancelMock, rescheduleMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  statusMock: vi.fn(),
  cancelMock: vi.fn(),
  rescheduleMock: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useCreateAppointment: () => createMock,
  useChangeAppointmentStatus: () => statusMock,
  useCancelAppointment: () => cancelMock,
  useRescheduleAppointment: () => rescheduleMock,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TODAY = dateKey(new Date());

const rows: AgendaRow[] = [
  {
    id: 'a1',
    startAt: `${TODAY}T09:00:00.000Z`,
    endAt: `${TODAY}T09:30:00.000Z`,
    clientName: 'Luis',
    clientContact: 'luis@mail.dev · +34600123456',
    serviceName: 'Corte de cabello',
    durationMinutes: 30,
    resourceName: 'Ana Profesional',
    status: 'confirmed',
    currency: 'EUR',
    payment: null,
    notifications: [],
  },
];

const pendingRow: AgendaRow = {
  ...rows[0]!,
  id: 'a2',
  clientName: 'Marta',
  status: 'pending',
  payment: {
    methodType: 'mobile_payment',
    amountCents: 1000,
    reference: 'REF-9',
    proofUrl: 'https://x.test/proof.png',
    submittedAt: '2026-10-13T10:00:00.000Z',
  },
};

describe('Agenda (admin appointments)', () => {
  beforeEach(() => {
    createMock.mockReset();
    statusMock.mockReset();
    cancelMock.mockReset();
    rescheduleMock.mockReset();
  });

  function renderAgenda(props: Omit<AgendaProps, 'range'> & { range?: AgendaProps['range'] }) {
    return render(
      <FoundlyThemeProvider>
        <ToastProvider>
          <Agenda range={{ from: TODAY, to: TODAY }} {...props} />
        </ToastProvider>
      </FoundlyThemeProvider>,
    );
  }

  it('renders the table columns, status badge and details action', async () => {
    const { container } = renderAgenda({ appointments: rows });

    expect(screen.getByText('Agenda de citas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Nueva cita' })).toBeInTheDocument();
    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pendientes' })).toBeInTheDocument();

    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(screen.getByText('luis@mail.dev · +34600123456')).toBeInTheDocument();
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument();
    expect(screen.getByText('Ana Profesional')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Detalles' })).toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('shows an empty state', () => {
    renderAgenda({ appointments: [] });
    expect(screen.getByText('No hay citas en este periodo.')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    renderAgenda({ appointments: rows });

    await user.click(screen.getByRole('button', { name: 'Pendientes' }));
    expect(screen.queryByText('Luis')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmadas' }));
    expect(screen.getByText('Luis')).toBeInTheDocument();
  });

  it('opens the new-appointment and detail modals', async () => {
    const user = userEvent.setup();
    renderAgenda({ appointments: rows });

    await user.click(screen.getByRole('button', { name: '+ Nueva cita' }));
    expect(screen.getByText('Nueva cita')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    await user.click(screen.getByRole('button', { name: 'Detalles' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Detalle · Luis')).toBeInTheDocument();
    expect(dialog.getByText('Confirmada')).toBeInTheDocument();
  });

  it('shows the advance payment in the detail and omits it otherwise', async () => {
    const user = userEvent.setup();
    renderAgenda({ appointments: [pendingRow] });

    await user.click(screen.getByRole('button', { name: 'Detalles' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Adelanto')).toBeInTheDocument();
    expect(dialog.getByText(/REF-9/)).toBeInTheDocument();
    expect(dialog.getByText(/Pago Móvil/)).toBeInTheDocument();
  });

  it('accepts a pending appointment', async () => {
    statusMock.mockResolvedValue({ ok: true, data: { ...pendingRow, status: 'confirmed' } });
    const user = userEvent.setup();
    renderAgenda({ appointments: [pendingRow] });

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));
    expect(statusMock).toHaveBeenCalledWith({ appointmentId: 'a2', status: 'confirmed' });
    expect(await screen.findByText('Cita confirmada.')).toBeInTheDocument();
  });

  it('rejects a pending appointment with a reason', async () => {
    cancelMock.mockResolvedValue({ ok: true, data: { ...pendingRow, status: 'cancelled' } });
    const user = userEvent.setup();
    renderAgenda({ appointments: [pendingRow] });

    await user.click(screen.getByRole('button', { name: 'Detalles' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Rechazar' }));
    await user.click(screen.getByRole('button', { name: 'Rechazar' }));

    expect(cancelMock).toHaveBeenCalledWith({ appointmentId: 'a2', reason: 'No disponible' });
    expect(await screen.findByText('Cita rechazada.')).toBeInTheDocument();
  });

  it('reschedules an appointment', async () => {
    rescheduleMock.mockResolvedValue({
      ok: true,
      data: { ...pendingRow, startAt: '2026-11-01T11:00:00.000Z' },
    });
    const user = userEvent.setup();
    renderAgenda({ appointments: [pendingRow] });

    await user.click(screen.getByRole('button', { name: 'Detalles' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Reagendar' }));
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '11:00' } });
    await user.click(screen.getByRole('button', { name: 'Reagendar' }));

    expect(rescheduleMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Cita reprogramada.')).toBeInTheDocument();
  });

  it('creates an appointment with an offset ISO startAt', async () => {
    const service: Service = {
      id: 'svc-1',
      name: 'Corte de cabello',
      description: null,
      durationMinutes: 30,
      bufferMinutes: 0,
      category: null,
      active: true,
      tenantId: 'ten-ana',
      requiresAdvance: false,
      advanceKind: null,
      advanceValue: null,
    };
    const resource: Resource = {
      id: 'res-1',
      name: 'Ana Profesional',
      type: 'professional',
      active: true,
      timezone: 'Europe/Madrid',
      tenantId: 'ten-ana',
      role: null,
      avatar: null,
      bio: null,
      serviceIds: ['svc-1'],
    };
    createMock.mockResolvedValue({
      ok: true,
      data: {
        id: 'a9',
        resourceId: 'res-1',
        serviceId: 'svc-1',
        clientName: 'Ana',
        clientContact: null,
        startAt: '2026-10-20T09:00:00.000Z',
        endAt: '2026-10-20T09:30:00.000Z',
        status: 'confirmed',
        notes: null,
        appliedDurationMinutes: 30,
        appliedAmountCents: 0,
        appliedCurrency: 'EUR',
        origin: 'admin',
        cancellationReason: null,
        payment: null,
        notifications: [],
        createdAt: '2026-10-20T09:00:00.000Z',
        updatedAt: '2026-10-20T09:00:00.000Z',
      },
    });
    const user = userEvent.setup();
    renderAgenda({ appointments: [], services: [service], resources: [resource] });

    await user.click(screen.getByRole('button', { name: '+ Nueva cita' }));
    await user.click(screen.getByRole('button', { name: 'Corte de cabello' }));
    await user.click(screen.getByRole('button', { name: 'Ana Profesional' }));
    fireEvent.change(screen.getByLabelText(/Fecha/), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText(/Hora/), { target: { value: '09:00' } });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(createMock).toHaveBeenCalledTimes(1);
    const arg = createMock.mock.calls[0]![0] as { startAt: string };
    expect(arg.startAt).toMatch(/Z$/);
    expect(await screen.findByText('Cita creada.')).toBeInTheDocument();
  });
});
