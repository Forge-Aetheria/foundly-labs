import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { PublicFooter } from '../PublicFooter';

function renderFooter() {
  return render(
    <FoundlyThemeProvider>
      <PublicFooter />
    </FoundlyThemeProvider>,
  );
}

describe('PublicFooter', () => {
  it('renders the platform links and the copyright', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Negocios' })).toHaveAttribute('href', '/negocios');
    expect(screen.getByRole('link', { name: 'Registrar mi negocio' })).toHaveAttribute(
      'href',
      '/onboarding',
    );
    expect(screen.getByRole('link', { name: 'Privacidad' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
  });
});
