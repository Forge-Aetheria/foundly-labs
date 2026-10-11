import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import HomePage from './page';
import { BOOK_BENEFITS } from '../modules/landing/book-product';

function renderHome() {
  return render(
    <FoundlyThemeProvider>
      <HomePage />
    </FoundlyThemeProvider>,
  );
}

describe('product page (FR-001/FR-002/FR-019)', () => {
  it('renders the module capabilities and a CTA leading to /onboarding', async () => {
    const { container } = renderHome();

    for (const benefit of BOOK_BENEFITS) {
      expect(
        screen.getAllByText(benefit.title).length,
        `benefit "${benefit.title}" should be shown`,
      ).toBeGreaterThan(0);
    }

    const ctaLinks = screen.getAllByRole('link', { name: /Registrar mi negocio/i });
    expect(ctaLinks.length).toBeGreaterThan(0);
    expect(ctaLinks.some((link) => link.getAttribute('href') === '/onboarding')).toBe(true);

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('renders the conversion sections: hero capture, spotlight, steps and pricing', () => {
    renderHome();

    // Hero email capture + primary button
    expect(screen.getByLabelText(/Tu email/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Empezar gratis' }).length).toBeGreaterThan(0);

    // Spotlight title + booking page preview
    expect(
      screen.getByRole('heading', { name: /Tu Booking Page personalizada/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument();

    // Steps to success
    expect(screen.getByRole('heading', { name: /Empieza en 3 pasos/ })).toBeInTheDocument();
    expect(screen.getByText('Crea tu página')).toBeInTheDocument();
    expect(screen.getByText('Personaliza tu marca')).toBeInTheDocument();
    expect(screen.getByText('Comparte y agenda')).toBeInTheDocument();

    // Pricing plans
    expect(screen.getByRole('heading', { name: /Precios sencillos/ })).toBeInTheDocument();
    expect(screen.getByText('Plan Gratis')).toBeInTheDocument();
    expect(screen.getByText('Plan Pro')).toBeInTheDocument();
    expect(screen.getAllByText('$0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$5').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Probar Pro gratis' })).toBeInTheDocument();
  });
});
