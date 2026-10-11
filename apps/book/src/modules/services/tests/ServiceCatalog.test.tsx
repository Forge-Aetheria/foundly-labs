import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ServiceCatalog } from '../components/ServiceCatalog';

const services = [
  {
    id: 's1',
    name: 'Corte',
    description: null,
    durationMinutes: 30,
    bufferMinutes: 0,
    category: null,
    active: true,
    tenantId: 'ten-ana',
  },
  {
    id: 's2',
    name: 'Manicura',
    description: 'Uñas esmaltadas',
    durationMinutes: 45,
    bufferMinutes: 5,
    category: null,
    active: false,
    tenantId: 'ten-ana',
  },
];

const rates = [
  {
    id: 'r1',
    serviceId: 's1',
    amountCents: 2000,
    currency: 'EUR',
    effectiveFrom: '2020-01-01T00:00:00.000Z',
    effectiveTo: null,
  },
];

describe('ServiceCatalog (admin services)', () => {
  it('renders the header, CTA, search bar and priced status rows', async () => {
    const { container } = render(
      <FoundlyThemeProvider>
        <ServiceCatalog services={services} rates={rates} />
      </FoundlyThemeProvider>,
    );

    expect(screen.getByText('Servicios y tarifas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Crear servicio' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar servicio/)).toBeInTheDocument();

    expect(screen.getByText('Corte')).toBeInTheDocument();
    expect(screen.getByText('20,00 €')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2);

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('filters services by name through the quick search', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <ServiceCatalog services={services} rates={rates} />
      </FoundlyThemeProvider>,
    );

    await user.type(screen.getByLabelText(/Buscar servicio/), 'corte');
    expect(screen.getByText('Corte')).toBeInTheDocument();
    expect(screen.queryByText('Manicura')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Buscar servicio/));
    await user.type(screen.getByLabelText(/Buscar servicio/), 'inexistente');
    expect(screen.getByText(/no hay servicios que coincidan/i)).toBeInTheDocument();
  });
});
