import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { DirectoryView } from '../DirectoryView';
import type { DirectoryBusiness } from '../utils/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/directorio',
}));

const business: DirectoryBusiness = {
  tenantId: 't1',
  slug: 'estudio-ana',
  name: 'Estudio Ana',
  category: 'Peluquería',
  description: 'Estudio de referencia.',
  address: 'Calle Mayor 7, Madrid',
  logo: null,
  cover: null,
  hours: [{ weekday: 1, startTime: '09:00', endTime: '18:00' }],
};

function renderView(props: Partial<Parameters<typeof DirectoryView>[0]> = {}) {
  return render(
    <FoundlyThemeProvider>
      <DirectoryView query="" businesses={[business]} error={false} {...props} />
    </FoundlyThemeProvider>,
  );
}

describe('DirectoryView (019)', () => {
  it('renders a card per business with the search input', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Directorio de negocios' })).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar negocios')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Estudio Ana' })).toBeInTheDocument();
  });

  it('shows the empty-directory state when there are no businesses and no term', () => {
    renderView({ businesses: [], query: '' });
    expect(screen.getByText('Todavía no hay negocios')).toBeInTheDocument();
  });

  it('shows the no-results state when a term returns nothing', () => {
    renderView({ businesses: [], query: 'zzz' });
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todos los negocios' })).toBeInTheDocument();
  });

  it('shows the error state with a retry', () => {
    renderView({ businesses: [], error: true });
    expect(screen.getByText('No pudimos cargar el directorio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
