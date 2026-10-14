import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';

const { pushMock, refreshMock, signInMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  signInMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock('../hooks', () => ({ useSignIn: () => signInMock }));

import { LoginForm } from '../components/LoginForm';

describe('LoginForm (009 — US1)', () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    signInMock.mockReset();
  });

  it('submits credentials and redirects on success', async () => {
    signInMock.mockResolvedValue({ ok: true, data: { redirectTo: '/admin/agenda' } });
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <LoginForm />
      </FoundlyThemeProvider>,
    );

    await user.type(screen.getByLabelText(/Email/), 'ana@foundly.dev');
    await user.type(screen.getByLabelText(/Contraseña/), 'mock-credential');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(signInMock).toHaveBeenCalledTimes(1));
    expect(signInMock).toHaveBeenCalledWith({
      email: 'ana@foundly.dev',
      password: 'mock-credential',
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/agenda'));
    // Loading persists until the App Router lands on the admin workspace.
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
  });

  it('shows an inline error for invalid credentials', async () => {
    signInMock.mockResolvedValue({
      ok: false,
      error: { code: 'UNAUTHENTICATED', message: 'Email o contraseña incorrectos.' },
    });
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <LoginForm />
      </FoundlyThemeProvider>,
    );

    await user.type(screen.getByLabelText(/Email/), 'ana@foundly.dev');
    await user.type(screen.getByLabelText(/Contraseña/), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('explains the bounce when the session expired (feature 012)', () => {
    render(
      <FoundlyThemeProvider>
        <LoginForm sessionExpired />
      </FoundlyThemeProvider>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/sesión ha caducado/i);
  });
});
