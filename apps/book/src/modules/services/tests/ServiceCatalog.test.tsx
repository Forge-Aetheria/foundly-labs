import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ToastProvider } from '../../../shared/components/Toaster';
import { ServiceCatalog } from '../components/ServiceCatalog';

const { createMock, updateMock, deleteMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useFetchServices: () => vi.fn(),
  useCreateService: () => createMock,
  useUpdateService: () => updateMock,
  useDeleteService: () => deleteMock,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

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
  beforeEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  function renderCatalog() {
    return render(
      <FoundlyThemeProvider>
        <ToastProvider>
          <ServiceCatalog services={services} rates={rates} />
        </ToastProvider>
      </FoundlyThemeProvider>,
    );
  }

  it('renders the header, CTA, search bar and priced status rows', async () => {
    const { container } = renderCatalog();

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
    renderCatalog();

    await user.type(screen.getByLabelText(/Buscar servicio/), 'corte');
    expect(screen.getByText('Corte')).toBeInTheDocument();
    expect(screen.queryByText('Manicura')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Buscar servicio/));
    await user.type(screen.getByLabelText(/Buscar servicio/), 'inexistente');
    expect(screen.getByText(/no hay servicios que coincidan/i)).toBeInTheDocument();
  });

  it('creates a service through the hook and shows a success toast', async () => {
    createMock.mockResolvedValue({
      ok: true,
      data: {
        id: 's9',
        name: 'Nuevo',
        description: null,
        durationMinutes: 30,
        bufferMinutes: 0,
        category: null,
        active: true,
        tenantId: 'ten-ana',
      },
    });
    const user = userEvent.setup();
    renderCatalog();

    await user.click(screen.getByRole('button', { name: '+ Crear servicio' }));
    await user.type(screen.getByLabelText(/Nombre/), 'Nuevo');
    await user.type(screen.getByLabelText(/Duración/), '30');
    await user.type(screen.getByLabelText(/Precio/), '20');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(createMock).toHaveBeenCalledWith({
      name: 'Nuevo',
      description: '',
      durationMinutes: 30,
      priceCents: 2000,
      category: '',
    });
    expect(await screen.findByText('Servicio creado.')).toBeInTheDocument();
  });
});
