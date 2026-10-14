import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ToastProvider } from '../../../shared/components/Toaster';
import type { Resource, Service } from '../../../shared/types/appointments';
import { Agenda, type AgendaProps, type AgendaRow } from '../components/Agenda';

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock('../hooks', () => ({ useCreateAppointment: () => createMock }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

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
  },
];

describe('Agenda (admin appointments)', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  function renderAgenda(props: AgendaProps) {
    return render(
      <FoundlyThemeProvider>
        <ToastProvider>
          <Agenda {...props} />
        </ToastProvider>
      </FoundlyThemeProvider>,
    );
  }

  it('renders the table columns, status badge and details action', async () => {
    const { container } = renderAgenda({ appointments: rows });

    expect(screen.getByText('Agenda de citas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Nueva cita' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hoy' })).toBeInTheDocument();
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
