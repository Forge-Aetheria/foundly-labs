import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { BusinessCard } from '../components/BusinessCard';
import type { DirectoryBusiness } from '../utils/types';

function makeBusiness(overrides: Partial<DirectoryBusiness> = {}): DirectoryBusiness {
  return {
    tenantId: 't1',
    slug: 'estudio-ana',
    name: 'Estudio Ana',
    category: 'Peluquería',
    description: 'Estudio de referencia en Madrid.',
    address: 'Calle Mayor 7, Madrid',
    logo: 'https://cdn/logo.png',
    cover: 'https://cdn/cover.png',
    hours: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: '09:00', endTime: '18:00' })),
    ...overrides,
  };
}

function renderCard(business = makeBusiness()) {
  return render(
    <FoundlyThemeProvider>
      <BusinessCard business={business} />
    </FoundlyThemeProvider>,
  );
}

describe('BusinessCard (019)', () => {
  it('renders the full card content', () => {
    renderCard();
    expect(screen.getByRole('heading', { name: 'Estudio Ana' })).toBeInTheDocument();
    expect(screen.getByText('Peluquería')).toBeInTheDocument();
    expect(screen.getByText('Estudio de referencia en Madrid.')).toBeInTheDocument();
    expect(screen.getByText('Calle Mayor 7, Madrid')).toBeInTheDocument();
    expect(screen.getByText('Lun–Vie 09:00–18:00')).toBeInTheDocument();
    expect(screen.getByAltText('Portada de Estudio Ana')).toHaveAttribute('src', 'https://cdn/cover.png');
    expect(screen.getByAltText('Logo de Estudio Ana')).toBeInTheDocument();
  });

  it('links the CTA to the public business page', () => {
    renderCard();
    const primary = screen.getByRole('link', { name: 'Ver perfil de Estudio Ana' });
    expect(primary).toHaveAttribute('href', '/estudio-ana');
    const secondary = screen.getByRole('link', { name: 'Reservar en Estudio Ana' });
    expect(secondary).toHaveAttribute('href', '/estudio-ana');
  });

  it('degrades gracefully with placeholders when optional fields are missing', () => {
    renderCard(makeBusiness({ description: null, cover: null, logo: null, address: null, hours: [] }));
    expect(screen.getByText('Sin descripción por el momento.')).toBeInTheDocument();
    expect(screen.getByText('Ubicación no indicada')).toBeInTheDocument();
    expect(screen.getByText('Horario no disponible')).toBeInTheDocument();
    expect(screen.queryByAltText('Portada de Estudio Ana')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Logo de Estudio Ana')).not.toBeInTheDocument();
    // The initial-letter avatar is shown instead of the logo.
    expect(screen.getByText('E')).toBeInTheDocument();
  });

  it('shows "(... ver más)" with a tooltip for a long description', async () => {
    const longDescription = 'Descripción muy larga del negocio. '.repeat(8).trim();
    const user = userEvent.setup();
    renderCard(makeBusiness({ description: longDescription }));

    const suffix = screen.getByText('(... ver más)');
    expect(suffix).toBeInTheDocument();

    await user.hover(suffix);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(longDescription);
  });

  it('omits the "(... ver más)" suffix for a short description', () => {
    renderCard();
    expect(screen.queryByText('(... ver más)')).not.toBeInTheDocument();
  });
});
