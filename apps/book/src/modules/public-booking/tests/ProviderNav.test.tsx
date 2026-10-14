import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ProviderNav } from '../components/ProviderNav';
import type { PublicBusinessProfile } from '../utils/types';

const profile: PublicBusinessProfile = {
  slug: 'estudio-ana',
  name: 'Estudio Ana',
  category: 'Peluquería',
  avatar: null,
  cover: null,
  bio: null,
  address: 'Calle Mayor 7, Madrid',
  phone: '+34 612 345 678',
  social: { whatsapp: 'https://wa.me/34612345678' },
  timezone: 'Europe/Madrid',
  services: [],
  specialists: [],
  weeklyHours: [],
  policies: [],
};

function renderNav() {
  return render(
    <FoundlyThemeProvider>
      <ProviderNav profile={profile} />
      <section id="servicios" />
      <section id="equipo" />
      <section id="acerca" />
      <section id="galeria" />
      <section id="resenas" />
      <section id="ubicacion" />
    </FoundlyThemeProvider>,
  );
}

describe('ProviderNav (003 header)', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('shows the business brand and the plain-text section links', () => {
    renderNav();
    expect(screen.getByText('Estudio Ana')).toBeInTheDocument();
    for (const label of ['Servicios', 'Equipo', 'Acerca de', 'Galería', 'Reseñas', 'Ubicación']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
    // The Foundly Book branding belongs to the global header, not the business header.
    expect(screen.queryByAltText('Foundly Book')).not.toBeInTheDocument();
  });

  it('scrolls the target section into view when a link is activated', async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole('link', { name: 'Servicios' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('exposes the business contact on the right', () => {
    renderNav();
    expect(screen.getByRole('link', { name: '+34 612 345 678' })).toHaveAttribute(
      'href',
      'tel:+34 612 345 678',
    );
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/34612345678',
    );
  });
});
