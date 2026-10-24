import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { PublicHeader } from '../PublicHeader';

function renderHeader() {
  return render(
    <FoundlyThemeProvider>
      <PublicHeader />
    </FoundlyThemeProvider>,
  );
}

function renderAuthHeader() {
  return render(
    <FoundlyThemeProvider>
      <PublicHeader variant="auth" />
    </FoundlyThemeProvider>,
  );
}

describe('PublicHeader', () => {
  it('renders the navigation options and the primary CTA', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: 'Buscar negocios' })).toHaveAttribute(
      'href',
      '/negocios',
    );
    expect(screen.getByRole('link', { name: 'Precios' })).toHaveAttribute('href', '/#precios');
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Registrar mi negocio' })).toHaveAttribute(
      'href',
      '/onboarding',
    );
  });

  it('does not render the removed "Ver Demo" option', () => {
    renderHeader();
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it('reduces to the login affordance in the auth variant', () => {
    renderAuthHeader();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('link', { name: 'Buscar negocios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Precios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Registrar mi negocio' })).not.toBeInTheDocument();
  });
});
