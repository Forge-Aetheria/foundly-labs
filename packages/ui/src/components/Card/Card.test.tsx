import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test-utils/a11y';
import { FoundlyThemeProvider } from '../../theme';
import { Card } from './Card';

describe('Card', () => {
  it('renders optional header, media and actions slots', async () => {
    const { container } = render(
      <FoundlyThemeProvider>
        <Card
          header={<h3>Servicios</h3>}
          media={<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Portada" />}
          actions={<button type="button">Ver</button>}
        >
          <p>Contenido de la tarjeta</p>
        </Card>
      </FoundlyThemeProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Servicios' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Portada' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('renders an elevated variant', () => {
    render(
      <FoundlyThemeProvider>
        <Card elevated>Elevada</Card>
      </FoundlyThemeProvider>,
    );
    expect(screen.getByText('Elevada')).toBeInTheDocument();
  });

  it('forwards sx overrides (e.g. glass surface)', () => {
    render(
      <FoundlyThemeProvider>
        <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>Glass</Card>
      </FoundlyThemeProvider>,
    );
    expect(screen.getByText('Glass').closest('.MuiPaper-root')).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    });
  });
});
