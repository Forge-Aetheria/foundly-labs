import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { FoundlyThemeProvider } from '@foundly/ui';
import { Agenda, type AgendaRow } from '../components/Agenda';

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
  it('renders the table columns, status badge and details action', async () => {
    const { container } = render(
      <FoundlyThemeProvider>
        <Agenda appointments={rows} />
      </FoundlyThemeProvider>,
    );

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
    render(
      <FoundlyThemeProvider>
        <Agenda appointments={[]} />
      </FoundlyThemeProvider>,
    );
    expect(screen.getByText('No hay citas en este periodo.')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <Agenda appointments={rows} />
      </FoundlyThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Pendientes' }));
    expect(screen.queryByText('Luis')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmadas' }));
    expect(screen.getByText('Luis')).toBeInTheDocument();
  });

  it('opens the new-appointment and detail modals', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <Agenda appointments={rows} />
      </FoundlyThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: '+ Nueva cita' }));
    expect(screen.getByText('Nueva cita')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    await user.click(screen.getByRole('button', { name: 'Detalles' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Detalle · Luis')).toBeInTheDocument();
    expect(dialog.getByText('Confirmada')).toBeInTheDocument();
  });
});
