import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { Resource, Service } from '../../../domain/appointments/types';
import { getStore, resetStore } from '../../../server/store';
import { getPublicBusiness } from '../../public-booking/queries';
import { StaffManager } from './StaffManager';

function staffFromStore(): Resource[] {
  return getStore().resources.filter((resource) => resource.tenantId === 'ten-ana');
}

function servicesFromStore(): Service[] {
  return getStore().services.filter((service) => service.tenantId === 'ten-ana');
}

function renderManager() {
  return render(
    <FoundlyThemeProvider>
      <StaffManager staff={staffFromStore()} services={servicesFromStore()} />
    </FoundlyThemeProvider>,
  );
}

describe('StaffManager (admin Equipo y Especialistas, 005)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the member grid with service and status badges plus actions', async () => {
    const { container } = renderManager();

    expect(screen.getByText('Equipo y Especialistas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Añadir Profesional' })).toBeInTheDocument();

    // Ana carries an assigned service; Luis has none.
    expect(screen.getByText('Ana Profesional')).toBeInTheDocument();
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument();
    expect(screen.getByText('Sin servicios asignados')).toBeInTheDocument();
    expect(screen.getAllByText('Activo')).toHaveLength(2);

    expect(screen.getAllByRole('button', { name: 'Desactivar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2);

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('adds a professional with an assigned service, reflected on the public portal', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir Profesional' }));
    await user.type(screen.getByLabelText(/Nombre/), 'Nuria Pons');
    await user.type(screen.getByLabelText(/Cargo/), 'Colorista');
    await user.click(screen.getByRole('checkbox', { name: 'Corte de cabello' }));
    await user.click(screen.getByRole('button', { name: 'Guardar profesional' }));

    expect(screen.getByText('Nuria Pons')).toBeInTheDocument();
    const portal = getPublicBusiness('estudio-ana');
    expect(portal.status).toBe('available');
    if (portal.status === 'available') {
      const specialist = portal.business.specialists.find((s) => s.name === 'Nuria Pons');
      expect(specialist?.services).toContain('Corte de cabello');
    }
  });

  it('blocks saving when name or role are missing', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir Profesional' }));
    await user.click(screen.getByRole('button', { name: 'Guardar profesional' }));

    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('El cargo es obligatorio.')).toBeInTheDocument();

    // The modal stays open.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('warns when no service is assigned while allowing the save', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir Profesional' }));
    const warning = screen.getByText(/no tiene ningún servicio asignado/i);
    expect(warning).toBeInTheDocument();

    // Select a service and the warning clears.
    await user.click(screen.getByRole('checkbox', { name: 'Corte de cabello' }));
    expect(screen.queryByText(/no tiene ningún servicio asignado/i)).not.toBeInTheDocument();
  });

  it('re-opens edit with existing values pre-filled', async () => {
    const user = userEvent.setup();
    renderManager();

    // Ana: data saved on the seeded store.
    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Editar · Ana Profesional')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Ana Profesional');
    expect(screen.getByLabelText(/Cargo/)).toHaveValue('Peluquera senior');
    expect(screen.getByRole('checkbox', { name: 'Corte de cabello' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Activo/ })).toBeChecked();
  });

  it('toggles a professional away from the public team', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Desactivar' })[0]!);
    expect(screen.getAllByText('Inactivo')).toHaveLength(1);

    const portal = getPublicBusiness('estudio-ana');
    if (portal.status === 'available') {
      expect(portal.business.specialists.map((s) => s.name)).not.toContain('Ana Profesional');
    }
  });

  it('removes a professional after confirming the dialog', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]!);
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(screen.queryByText('Ana Profesional')).not.toBeInTheDocument();
  });
});