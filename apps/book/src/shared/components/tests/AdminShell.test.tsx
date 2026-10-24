import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/agenda' }));
vi.mock('../../../modules/auth/hooks', () => ({ useSignOut: () => vi.fn() }));

import { AdminShell } from '../AdminShell';

function renderShell(
  props: {
    publicHref?: string | null;
    isPublic?: boolean;
    headerStart?: ReactNode;
    headerActions?: ReactNode;
    userName?: string;
    userEmail?: string;
  } = {},
) {
  return render(
    <FoundlyThemeProvider>
      <AdminShell tenantName="Estudio Ana" {...props}>
        <p>Contenido</p>
      </AdminShell>
    </FoundlyThemeProvider>,
  );
}

describe('AdminShell (009 — US3/US4)', () => {
  it('renders the public page link with the owner slug', () => {
    renderShell({ publicHref: '/estudio-ana' });
    const links = screen.getAllByRole('link', { name: /Ver página pública/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/estudio-ana');
  });

  it('hides the public link when there is no slug', () => {
    renderShell({ publicHref: null });
    expect(screen.queryAllByRole('link', { name: /Ver página pública/ })).toHaveLength(0);
  });

  it('renders the authenticated identity instead of hardcoded data', () => {
    renderShell({ userName: 'Ana Belén', userEmail: 'ana@foundly.dev' });
    expect(screen.getAllByText('Ana Belén').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ana@foundly.dev').length).toBeGreaterThan(0);
    expect(screen.queryByText('Raúl Gómez')).not.toBeInTheDocument();
  });

  it('renders a sign-out control', () => {
    renderShell({ publicHref: '/estudio-ana' });
    expect(screen.getAllByRole('button', { name: 'Cerrar sesión' }).length).toBeGreaterThan(0);
  });

  it('pins the disabled-public banner with a link to Configuración when isPublic is false', () => {
    renderShell({ isPublic: false });
    expect(
      screen.getByText(/Tu página pública está actualmente deshabilitada/),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Ir a Configuración' });
    expect(link).toHaveAttribute('href', '/admin/configuracion');
  });

  it('does not render the disabled-public banner by default', () => {
    renderShell();
    expect(screen.queryByText(/Tu página pública está actualmente deshabilitada/)).toBeNull();
  });

  it('renders headerActions inside the persistent top bar', () => {
    renderShell({ headerActions: <span>Acción de cabecera</span> });
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Acción de cabecera')).toBeInTheDocument();
  });

  it('keeps header actions in the last (right-aligned) region, after a left slot', () => {
    renderShell({
      headerStart: <span>Migas de pan</span>,
      headerActions: <span>Acción de cabecera</span>,
    });
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Migas de pan')).toBeInTheDocument();

    const lastRegion = header.lastElementChild;
    expect(lastRegion).not.toBeNull();
    expect(within(lastRegion as HTMLElement).getByText('Acción de cabecera')).toBeInTheDocument();
  });
});
