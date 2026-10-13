import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';

const { pushMock, createBusinessMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  createBusinessMock: vi.fn(async () => ({
    ok: true,
    data: { tenantId: 't-1', redirectTo: '/admin/agenda' },
  })),
}));

vi.mock('next/navigation', () => ({
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
      <FoundlyThemeProvider>
        <WizardShell />
      </FoundlyThemeProvider>,
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
    await user.type(screen.getByLabelText(/Categoría/), 'Estética');
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
      <FoundlyThemeProvider>
        <WizardShell />
      </FoundlyThemeProvider>,
    );
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });
});
