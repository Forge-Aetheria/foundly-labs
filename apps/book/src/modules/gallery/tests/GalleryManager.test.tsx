import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { GalleryManager } from '../components/GalleryManager';

describe('GalleryManager (admin Galería, 006-gallery-management — feature 010 empty state)', () => {
  it('renders a clean empty state with no mocked photos or actions', async () => {
    const { container } = render(
      <FoundlyThemeProvider>
        <GalleryManager />
      </FoundlyThemeProvider>,
    );

    expect(screen.getByText('Galería')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay fotos')).toBeInTheDocument();
    // No invented content and no fake actions.
    expect(screen.queryByAltText('Foto de la galería')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Añadir imagen/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar foto' })).not.toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });
});