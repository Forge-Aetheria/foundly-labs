import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { Resource } from '../../../domain/appointments/types';
import { getStore, resetStore } from '../../../server/store';
import { getPublicBusiness } from '../../public-booking/queries';
import { StaffManager } from './StaffManager';

function staffFromStore(): Resource[] {
  return getStore().resources.filter((resource) => resource.tenantId === 'ten-ana');
}

function renderManager() {
  return render(
    <FoundlyThemeProvider>
      <StaffManager staff={staffFromStore()} />
    </FoundlyThemeProvider>,
  );
}

describe('StaffManager (admin Equipo, US4 storefront)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the roster with status badges, avatar initials and row actions', async () => {
    const { container } = renderManager();

    expect(screen.getByText('Equipo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Añadir profesional' })).toBeInTheDocument();
    expect(screen.getByText('Ana Profesional')).toBeInTheDocument();
    expect(screen.getByText('Luis Estilista')).toBeInTheDocument();
    expect(screen.getAllByText('Activo')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Desactivar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2);

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('adds a professional that is then visible in the public portal query', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir profesional' }));
    await user.type(screen.getByLabelText(/Nombre/), 'Nuria Pons');
    await user.type(screen.getByLabelText(/Rol \/ cargo/), 'Colorista');
    await user.click(screen.getByRole('button', { name: 'Añadir' }));

    expect(screen.getByText('Nuria Pons')).toBeInTheDocument();
    const portal = getPublicBusiness('estudio-ana');
    expect(portal.status).toBe('available');
    if (portal.status === 'available') {
      expect(portal.business.specialists.some((s) => s.name === 'Nuria Pons')).toBe(true);
    }
  });

  it('toggles a professional activation state', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Desactivar' })[0]);
    expect(screen.getAllByText('Inactivo')).toHaveLength(1);
  });

  it('removes a professional after confirming the dialog', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(screen.queryByText('Ana Profesional')).not.toBeInTheDocument();
  });
});