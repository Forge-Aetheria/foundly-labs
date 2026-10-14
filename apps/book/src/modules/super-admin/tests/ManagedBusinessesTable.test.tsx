import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ManagedBusinessesTable } from '../components/ManagedBusinessesTable';
import type { ManagedBusinessView } from '../utils/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/super-admin',
}));

const rows: ManagedBusinessView[] = [
  { tenantId: 't1', slug: 'estudio-ana', name: 'Estudio Ana', plan: 'FREE', status: 'active', expiresAt: null },
  { tenantId: 't2', slug: 'rona', name: 'Rona', plan: 'PRO', status: 'expired', expiresAt: '2027-01-01T00:00:00.000Z' },
];

describe('ManagedBusinessesTable (020)', () => {
  it('renders a row per business with plan, status and expiry', () => {
    render(
      <FoundlyThemeProvider>
        <ManagedBusinessesTable businesses={rows} />
      </FoundlyThemeProvider>,
    );
    expect(screen.getByText('Estudio Ana')).toBeInTheDocument();
    expect(screen.getByText('Rona')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
    expect(screen.getByText('PRO')).toBeInTheDocument();
    expect(screen.getByText('Vencida')).toBeInTheDocument();
    expect(screen.getByText('2027-01-01')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar suscripción de Rona' })).toBeInTheDocument();
  });

  it('shows the empty state with no businesses', () => {
    render(
      <FoundlyThemeProvider>
        <ManagedBusinessesTable businesses={[]} />
      </FoundlyThemeProvider>,
    );
    expect(screen.getByText('Sin negocios')).toBeInTheDocument();
  });
});
