import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { getStore, resetStore } from '../../../server/store';
import { getPublicBusiness } from '../../public-booking/queries';
import { GalleryManager } from './GalleryManager';

function galleryFromStore(): string[] {
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

describe('GalleryManager (admin Galería, US4 storefront)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the seeded photo grid with a remove action per tile', async () => {
    const { container } = renderManager();
    const seeded = galleryFromStore().length;

    expect(screen.getByText('Galería')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Añadir imagen' })).toBeInTheDocument();
    expect(screen.getAllByAltText('Foto de la galería')).toHaveLength(seeded);
    expect(screen.getAllByRole('button', { name: 'Quitar foto' })).toHaveLength(seeded);

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('adds an image that is then part of the public gallery', async () => {
    const user = userEvent.setup();
    const seeded = galleryFromStore().length;
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir imagen' }));
    await user.type(screen.getByLabelText('URL de la imagen'), 'https://example.com/foto-3.jpg');
    await user.click(screen.getByRole('button', { name: 'Añadir' }));

    expect(screen.getAllByAltText('Foto de la galería')).toHaveLength(seeded + 1);
    const portal = getPublicBusiness('estudio-ana');
    if (portal.status === 'available') {
      expect(portal.business.gallery).toContain('https://example.com/foto-3.jpg');
    }
  });

  it('removes an image after confirming the dialog', async () => {
    const user = userEvent.setup();
    const seeded = galleryFromStore().length;
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Quitar foto' })[0]);
    await user.click(screen.getByRole('button', { name: 'Sí, quitar' }));

    expect(screen.getAllByAltText('Foto de la galería')).toHaveLength(seeded - 1);
  });
});