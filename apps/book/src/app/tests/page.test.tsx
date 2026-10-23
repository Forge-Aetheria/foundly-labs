import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import HomePage from '../page';
import { BOOK_BENEFITS } from '../../modules/landing/book-product';

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

    const results = await axe(container, {
      preload: false,
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });

  it('renders the conversion sections: hero capture, spotlight, steps and pricing', () => {
    const { container } = renderHome();

    // Hero email capture + primary button
    expect(screen.getByLabelText(/Tu email/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Empezar gratis' }).length).toBeGreaterThan(0);

    // Spotlight title + booking page preview
    expect(
      screen.getByRole('heading', { name: /Tu Booking Page personalizada/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument();

    // Steps to success
    expect(screen.getByRole('heading', { name: /3 pasos para el éxito/ })).toBeInTheDocument();
    expect(screen.getByText('Crea tu página')).toBeInTheDocument();
    expect(screen.getByText('Personaliza tu marca')).toBeInTheDocument();
    expect(screen.getByText('Comparte y agenda')).toBeInTheDocument();
    // ...with their embedded UI previews
    expect(screen.getByText('foundlylabs.lat/')).toBeInTheDocument();
    expect(screen.getByText('tu-negocio')).toBeInTheDocument();
    expect(screen.getByText('Estudio Luna')).toBeInTheDocument();
    expect(screen.getByText('4,9 · 128 reseñas')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Web')).toBeInTheDocument();

    // Sector cards link to the directory search and autoplay their demo video
    const sector = screen.getByRole('link', { name: /Salud y Bienestar/ });
    expect(sector).toHaveAttribute('href', '/negocios?q=Salud');

    const videos = Array.from(container.querySelectorAll('video'));
    expect(videos).toHaveLength(4);
    for (const video of videos) {
      expect(video.autoplay).toBe(true);
      expect(video.loop).toBe(true);
      expect(video.muted).toBe(true);
      expect(video.playsInline).toBe(true);
    }
    expect(videos.map((video) => video.querySelector('source')?.getAttribute('src'))).toEqual([
      '/videos/barber_shop.mp4',
      '/videos/massage.mp4',
      '/videos/training.mp4',
      '/videos/consulting.mp4',
    ]);

    // Pricing plans
    expect(screen.getByRole('heading', { name: /Precios sencillos/ })).toBeInTheDocument();
    expect(screen.getByText('Plan Gratis')).toBeInTheDocument();
    expect(screen.getByText('Plan Pro')).toBeInTheDocument();
    expect(screen.getAllByText('$0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$5').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Probar Pro gratis' })).toBeInTheDocument();
  });
});
