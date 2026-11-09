import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRouter } from '../router';

describe('AppRouter (feature 024)', () => {
  it('renders the branded 404 for unknown routes', () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/one/two/three']}>
          <AppRouter />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(screen.getByText(/Página no encontrada/i)).toBeInTheDocument();
  });
});
