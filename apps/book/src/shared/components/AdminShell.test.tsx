import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/agenda' }));
vi.mock('../../modules/auth/hooks', () => ({ useSignOut: () => vi.fn() }));

import { AdminShell } from './AdminShell';

function renderShell(props: { publicHref?: string | null } = {}) {
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

  it('renders a sign-out control', () => {
    renderShell({ publicHref: '/estudio-ana' });
    expect(screen.getAllByRole('button', { name: 'Cerrar sesión' }).length).toBeGreaterThan(0);
  });
});
