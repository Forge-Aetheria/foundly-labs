import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test-utils/testQueryClient';

const { pushMock, createBusinessMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  createBusinessMock: vi.fn(async () => ({
    ok: true,
    data: { tenantId: 't-1', redirectTo: '/admin/agenda' },
  })),
}));

vi.mock('@/shared/compat/useAppRouter', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('../hooks', () => ({
  useValidateSlug: () => vi.fn(async () => ({ available: true })),
  useCreateBusiness: () => createBusinessMock,
}));

import { WizardShell } from '../components/WizardShell';

describe('WizardShell (US1, contracts/onboarding.contract.md)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
    createBusinessMock.mockClear();
  });

  it('walks the three steps and provisions the business', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={createTestQueryClient()}><FoundlyThemeProvider><MemoryRouter>
        <WizardShell />
      </MemoryRouter></FoundlyThemeProvider></QueryClientProvider>,
    );

    // Step 1 — account
    await user.type(screen.getByLabelText(/Nombre completo/), 'Raúl Gómez');
    await user.type(screen.getByLabelText(/Email/), 'raul@nuevo.dev');
    await user.type(screen.getByLabelText(/Contraseña/), 'secreto123');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Step 2 — business (with live slug feedback pending)
    expect(screen.getByLabelText(/Nombre del negocio/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Nombre del negocio/), 'Estudio Nuevo');
    await user.type(screen.getByLabelText(/URL pública/), 'estudio-nuevo');
    await user.click(screen.getByRole('combobox', { name: /Categoría/ }));
    await user.click(screen.getByRole('option', { name: 'Salud y Bienestar' }));

    // The phone preview mirrors the typed business data before continuing.
    expect(screen.getAllByText('Estudio Nuevo').length).toBeGreaterThan(0);
    expect(screen.getByText('foundlylabs.lat/book/estudio-nuevo')).toBeInTheDocument();
    expect(screen.getAllByText('Salud y Bienestar').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Step 3 — setup
    const duration = screen.getByLabelText(/Duración por defecto/);
    await user.clear(duration);
    await user.type(duration, '45');
    await user.click(screen.getByRole('button', { name: 'Crear negocio' }));

    await waitFor(() => expect(createBusinessMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/agenda'));
  }, 20000);

  it('is accessible on the first step', async () => {
    const { container } = render(
      <QueryClientProvider client={createTestQueryClient()}><FoundlyThemeProvider><MemoryRouter>
        <WizardShell />
      </MemoryRouter></FoundlyThemeProvider></QueryClientProvider>,
    );

    const loginLinks = screen.getAllByRole('link', { name: 'Iniciar sesión' });
    expect(loginLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Registrar mi negocio' })).toHaveAttribute(
      'href',
      '/onboarding',
    );
    expect(screen.getByRole('link', { name: 'Privacidad' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByText(/Foundly Labs/)).toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('pre-fills the email captured in the landing hero', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}><FoundlyThemeProvider><MemoryRouter>
        <WizardShell initialEmail="ana@negocio.dev" />
      </MemoryRouter></FoundlyThemeProvider></QueryClientProvider>,
    );

    expect(screen.getByLabelText(/Email/)).toHaveValue('ana@negocio.dev');
  });
});
