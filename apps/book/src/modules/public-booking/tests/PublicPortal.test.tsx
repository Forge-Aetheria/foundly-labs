import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ToastProvider } from '../../../shared/components/Toaster';
import type { PublicBusinessProfile } from '../utils/types';
import { PublicPortal } from '../components/PublicPortal';

vi.mock('../actions', () => ({
  fetchOfferedSlots: vi.fn(async () => []),
  bookPublicAppointment: vi.fn(async () => ({ ok: true, data: { id: 'a-online-1' } })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const profile: PublicBusinessProfile = {
  slug: 'estudio-ana',
  name: 'Estudio Ana',
  category: 'Peluquería',
  avatar: 'https://images.unsplash.com/photo-avatar',
  cover: 'https://images.unsplash.com/photo-cover',
  bio: 'Somos un estudio de referencia en el centro de Madrid.',
  address: 'Calle Mayor 7, 28013 Madrid',
  phone: '+34 612 345 678',
  social: { instagram: 'https://instagram.com/estudioana', whatsapp: 'https://wa.me/34612345678' },
  timezone: 'Europe/Madrid',
  gallery: [
    { id: 'gallery-1', url: 'https://images.unsplash.com/photo-1' },
    { id: 'gallery-2', url: 'https://images.unsplash.com/photo-2' },
  ],
  rating: 4.6,
  reviewCount: 3,
  reviews: [
    {
      id: 'rev-1',
      author: 'Ana García',
      rating: 5,
      comment: 'Experiencia excelente, muy profesional.',
      date: '2026-09-01T00:00:00.000Z',
    },
  ],
  services: [
    {
      id: 'svc-corte',
      name: 'Corte de cabello',
      description: 'Corte y peinado',
      durationMinutes: 30,
      priceCents: 2000,
      currency: 'EUR',
      category: 'Peluquería',
      requiresAdvance: false,
      advanceKind: null,
      advanceValue: null,
    },
  ],
  specialists: [{ id: 'res-ana', name: 'Ana', role: 'Peluquera senior', avatar: null, bio: null }],
  weeklyHours: [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    weekday === 0
      ? { weekday, isOpen: false, startTime: '', endTime: '' }
      : { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' },
  ),
  policies: [{ title: 'Política de cancelación', body: 'Cancela gratis hasta 24 h antes.' }],
};

describe('PublicPortal (provider landing, FR-005…FR-008 + two-column landing, contracts/portal-ui.contract.md)', () => {
  function renderPortal(p = profile) {
    return render(
      <FoundlyThemeProvider>
        <ToastProvider>
          <PublicPortal profile={p} />
        </ToastProvider>
      </FoundlyThemeProvider>,
    );
  }

  it('renders the internal nav, main sections and the sticky sidebar', async () => {
    const { container } = renderPortal();

    // Internal nav anchors
    for (const label of ['Servicios', 'Equipo', 'Acerca de', 'Galería', 'Reseñas', 'Ubicación']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }

    // Header + sidebar: the business brand is shown
    expect(screen.getAllByText('Estudio Ana').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4.6').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Reservar en/ })).toBeInTheDocument();

    // Main column: service catalog, policies, gallery and reviews
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('20,00 €')).toBeInTheDocument();
    expect(screen.getByText('Política de cancelación')).toBeInTheDocument();
    expect(screen.getByText('Experiencia excelente, muy profesional.')).toBeInTheDocument();
    expect(screen.getByAltText('Foto 1')).toBeInTheDocument();
    // Full-width cover banner below the header.
    expect(screen.getByAltText('Portada de Estudio Ana')).toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('falls back to the first gallery photo when the cover is empty (feature 021)', () => {
    renderPortal({ ...profile, cover: null });

    const hero = screen.getByAltText('Portada de Estudio Ana');
    expect(hero).toHaveAttribute('src', 'https://images.unsplash.com/photo-1');
  });

  it('renders a branded gradient hero when there is no cover nor gallery (feature 021)', () => {
    renderPortal({ ...profile, cover: null, gallery: [] });

    const hero = screen.getByRole('img', { name: 'Portada de Estudio Ana' });
    expect(hero).toHaveTextContent('Estudio Ana');
  });

  it('shows assigned service badges on the team section', async () => {
    const withServices = {
      ...profile,
      specialists: [
        { ...profile.specialists[0]!, services: ['Corte de cabello'] },
        ...profile.specialists.slice(1),
      ],
    };
    const { container } = renderPortal(withServices);

    const team = container.querySelector('#equipo')!;
    expect(within(team as HTMLElement).getByText('Corte de cabello')).toBeInTheDocument();
  });

  it('opens the guided booking checkout from the sticky sidebar CTA', async () => {
    const user = userEvent.setup();
    renderPortal();

    await user.click(screen.getByRole('button', { name: /Reservar en/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Fecha y hora/)).toBeInTheDocument();
  });

  it('opens the guided booking checkout from a service card Reservar pill', async () => {
    const user = userEvent.setup();
    renderPortal();

    const serviceButtons = screen.getAllByRole('button', { name: 'Reservar' });
    // The sidebar CTA carries a distinct aria-label; the remaining Reservar pills belong to services.
    const serviceReserve = serviceButtons.find(
      (button) => button.getAttribute('aria-label') !== 'Reservar en Estudio Ana',
    );
    expect(serviceReserve).toBeDefined();
    await user.click(serviceReserve!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
