import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { SuperAdminView } from '../SuperAdminView';
import type { ManagedBusinessView, PlatformMetricsView } from '../utils/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/super-admin',
}));

const metrics: PlatformMetricsView = {
  businessesTotal: 1,
  businessesActive: 1,
  usersTotal: 3,
  usersActive: 2,
  usersAvailable: true,
  plansFree: 1,
  plansPro: 0,
  proConversion: 0,
};

const business: ManagedBusinessView = {
  tenantId: 't1',
  slug: 'estudio-ana',
  name: 'Estudio Ana',
  plan: 'FREE',
  status: 'active',
  expiresAt: null,
};

function renderView(props: Partial<Parameters<typeof SuperAdminView>[0]> = {}) {
  return render(
    <FoundlyThemeProvider>
      <SuperAdminView
        query=""
        page={1}
        metrics={metrics}
        businesses={[business]}
        denied={false}
        error={false}
        {...props}
      />
    </FoundlyThemeProvider>,
  );
}

describe('SuperAdminView (020)', () => {
  it('renders the dashboard and the businesses table', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Consola Super Admin' })).toBeInTheDocument();
    expect(screen.getByText('Total negocios')).toBeInTheDocument();
    expect(screen.getByText('Distribución de planes')).toBeInTheDocument();
    expect(screen.getByText('Estudio Ana')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar negocios')).toBeInTheDocument();
  });

  it('renders only the access-denied state for a non-admin (no platform data)', () => {
    renderView({ denied: true, metrics: null, businesses: [] });
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
    expect(screen.queryByText('Consola Super Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Estudio Ana')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Buscar negocios')).not.toBeInTheDocument();
  });

  it('renders the error state with a retry', () => {
    renderView({ error: true, metrics: null, businesses: [] });
    expect(screen.getByText('No pudimos cargar la consola')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
