import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { GalleryPhoto } from '../../../domain/tenancy/types';
import { getStore, resetStore } from '../../../server/store';
import { getPublicBusiness } from '../../public-booking/queries';
import { GalleryManager } from './GalleryManager';

function galleryFromStore(): GalleryPhoto[] {
  const tenant = getStore().tenants.find((item) => item.slug === 'estudio-ana');
  return tenant?.gallery ?? [];
}

function renderManager() {
  return render(
    <FoundlyThemeProvider>
      <GalleryManager gallery={galleryFromStore()} />
    </FoundlyThemeProvider>,
  );
}

describe('GalleryManager (admin Galería, 006-gallery-management)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the seeded photo grid with titles, category badges and actions', async () => {
    const { container } = renderManager();
    const seeded = galleryFromStore().length;

    expect(screen.getByText('Galería')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Añadir imagen' })).toBeInTheDocument();
    expect(screen.getAllByAltText('Foto de la galería')).toHaveLength(seeded);
    expect(screen.getByText('Nuestro espacio')).toBeInTheDocument();
    expect(screen.getAllByText('Trabajos').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Ver' })).toHaveLength(seeded);
    expect(screen.getAllByRole('button', { name: 'Quitar foto' })).toHaveLength(seeded);

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('blocks an invalid URL with an inline error', async () => {
    const user = userEvent.setup();
    renderManager();
    const seeded = galleryFromStore().length;

    await user.click(screen.getByRole('button', { name: '+ Añadir imagen' }));
    await user.type(screen.getByLabelText('URL de la imagen'), 'no-es-una-url');
    await user.click(screen.getByRole('button', { name: 'Añadir' }));

    expect(screen.getByText('La URL de la imagen es inválida.')).toBeInTheDocument();
    expect(screen.getAllByAltText('Foto de la galería')).toHaveLength(seeded);
  });

  it('adds a photo that is then part of the public gallery', async () => {
    const user = userEvent.setup();
    renderManager();
    const seeded = galleryFromStore().length;

    await user.click(screen.getByRole('button', { name: '+ Añadir imagen' }));
    await user.type(screen.getByLabelText('URL de la imagen'), 'https://example.com/foto-3.jpg');
    await user.type(screen.getByLabelText(/Título/), 'Nuevo local');
    await user.click(screen.getByRole('button', { name: 'Añadir' }));

    expect(screen.getAllByAltText('Foto de la galería')).toHaveLength(seeded + 1);
    expect(screen.getByText('Nuevo local')).toBeInTheDocument();

    const portal = getPublicBusiness('estudio-ana');
    if (portal.status === 'available') {
      expect(portal.business.gallery?.some((p) => p.url === 'https://example.com/foto-3.jpg')).toBe(true);
    }
  });

  it('opens and dismisses the lightbox preview', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Ver' })[0]!);
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('button', { name: /Cerrar/ })).toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: /Cerrar/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('removes a photo after confirming the dialog', async () => {
    const user = userEvent.setup();
    renderManager();
    const seeded = galleryFromStore().length;

    await user.click(screen.getAllByRole('button', { name: 'Quitar foto' })[0]!);
    await user.click(screen.getByRole('button', { name: 'Sí, quitar' }));

    expect(screen.getAllByAltText('Foto de la galería')).toHaveLength(seeded - 1);
  });
});