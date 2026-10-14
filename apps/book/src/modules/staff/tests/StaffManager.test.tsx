import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { Resource, Service } from '../../../shared/types/appointments';
import { ToastProvider } from '../../../shared/components/Toaster';
import { StaffManager } from '../components/StaffManager';

const { staffActionsMock } = vi.hoisted(() => ({
  staffActionsMock: {
    createStaff: vi.fn(),
    updateStaff: vi.fn(),
    setStaffActive: vi.fn(),
    removeStaff: vi.fn(),
  },
}));

vi.mock('../hooks', () => ({
  useCreateStaff: () => staffActionsMock.createStaff,
  useUpdateStaff: () => staffActionsMock.updateStaff,
  useSetStaffActive: () => staffActionsMock.setStaffActive,
  useRemoveStaff: () => staffActionsMock.removeStaff,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const services: Service[] = [
  {
    id: 'svc-corte',
    name: 'Corte de cabello',
    description: null,
    durationMinutes: 30,
    bufferMinutes: 0,
    category: null,
    active: true,
    tenantId: 'ten-ana',
  },
];

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'res-ana',
    name: 'Ana Profesional',
    type: 'professional',
    active: true,
    timezone: 'Europe/Madrid',
    tenantId: 'ten-ana',
    role: 'Peluquera senior',
    avatar: null,
    bio: 'Especialista en cortes, color y acabados.',
    serviceIds: ['svc-corte'],
    ...overrides,
  };
}

function renderManager(staff: Resource[] = [makeResource(), makeResource({ id: 'res-luis', name: 'Luis Estilista', role: 'Barbero', serviceIds: [] })]) {
  return render(
    <FoundlyThemeProvider>
      <ToastProvider>
        <StaffManager staff={staff} services={services} />
      </ToastProvider>
    </FoundlyThemeProvider>,
  );
}

describe('StaffManager (admin Equipo y Especialistas, 005)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    staffActionsMock.createStaff.mockImplementation(async (input: unknown) => {
      const data = input as { name: string; role?: string | null; bio?: string | null; avatar?: string | null; active?: boolean; serviceIds?: string[] };
      return {
        ok: true as const,
        data: makeResource({
          id: 'res-new',
          name: data.name,
          role: data.role ?? null,
          bio: data.bio ?? null,
          avatar: data.avatar ?? null,
          active: data.active ?? true,
          serviceIds: data.serviceIds ?? [],
        }),
      };
    });
    staffActionsMock.updateStaff.mockImplementation(async (input: unknown) => {
      const data = input as { id: string; name?: string; role?: string | null; bio?: string | null; avatar?: string | null; active?: boolean; serviceIds?: string[] };
      return { ok: true as const, data: makeResource({ id: data.id, name: data.name ?? 'Ana Profesional', serviceIds: data.serviceIds ?? [] }) };
    });
    staffActionsMock.setStaffActive.mockImplementation(async (input: unknown) => {
      const data = input as { id: string; active: boolean };
      return { ok: true as const, data: makeResource({ id: data.id, name: 'Ana Profesional', active: data.active }) };
    });
    staffActionsMock.removeStaff.mockImplementation(async (input: unknown) => {
      const data = input as { id: string };
      return { ok: true as const, data: { id: data.id } };
    });
  });

  it('renders the member grid with service and status badges plus actions', async () => {
    const { container } = renderManager();

    expect(screen.getByText('Equipo y Especialistas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Añadir Profesional' })).toBeInTheDocument();
    expect(screen.getByText('Ana Profesional')).toBeInTheDocument();
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument();
    expect(screen.getByText('Sin servicios asignados')).toBeInTheDocument();
    expect(screen.getAllByText('Activo')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Desactivar' })).toHaveLength(2);

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('adds a professional through the server action', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir Profesional' }));
    await user.type(screen.getByLabelText(/Nombre/), 'Nuria Pons');
    await user.type(screen.getByLabelText(/Cargo/), 'Colorista');
    await user.click(screen.getByRole('checkbox', { name: 'Corte de cabello' }));
    await user.click(screen.getByRole('button', { name: 'Guardar profesional' }));

    expect(await screen.findByText('Nuria Pons')).toBeInTheDocument();
    expect(staffActionsMock.createStaff).toHaveBeenCalledTimes(1);
  });

  it('blocks saving when name or role are missing', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir Profesional' }));
    await user.click(screen.getByRole('button', { name: 'Guardar profesional' }));

    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('El cargo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(staffActionsMock.createStaff).not.toHaveBeenCalled();
  });

  it('warns when no service is assigned while allowing the save', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir Profesional' }));
    expect(screen.getByText(/no tiene ningún servicio asignado/i)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Corte de cabello' }));
    expect(screen.queryByText(/no tiene ningún servicio asignado/i)).not.toBeInTheDocument();
  });

  it('re-opens edit with existing values pre-filled', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]!);
    expect(screen.getByText('Editar · Ana Profesional')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Ana Profesional');
    expect(screen.getByLabelText(/Cargo/)).toHaveValue('Peluquera senior');
    expect(screen.getByRole('checkbox', { name: 'Corte de cabello' })).toBeChecked();
  });

  it('toggles a professional to inactive through the server action', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Desactivar' })[0]!);
    expect(screen.getAllByText('Inactivo')).toHaveLength(1);
    expect(staffActionsMock.setStaffActive).toHaveBeenCalledWith({ id: 'res-ana', active: false });
  });

  it('removes a professional after confirming the dialog', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]!);
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(screen.queryByText('Ana Profesional')).not.toBeInTheDocument();
    expect(staffActionsMock.removeStaff).toHaveBeenCalledWith({ id: 'res-ana' });
  });
});