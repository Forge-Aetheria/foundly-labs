import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { MemoryRouter, useLocation } from 'react-router-dom';

const { signInMock } = vi.hoisted(() => ({ signInMock: vi.fn() }));

vi.mock('../hooks', () => ({ useSignIn: () => signInMock }));

import { LoginForm } from '../components/LoginForm';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderForm(sessionExpired = false) {
  return render(
    <FoundlyThemeProvider>
      <MemoryRouter initialEntries={['/login']}>
        <LoginForm sessionExpired={sessionExpired} />
        <LocationProbe />
      </MemoryRouter>
    </FoundlyThemeProvider>,
  );
}

describe('LoginForm (024 — SPA)', () => {
  beforeEach(() => {
    signInMock.mockReset();
  });

  it('submits credentials and navigates on success', async () => {
    signInMock.mockResolvedValue({ ok: true, data: { redirectTo: '/admin/agenda' } });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Email/), 'ana@foundly.dev');
    await user.type(screen.getByLabelText(/Contraseña/), 'mock-credential');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(signInMock).toHaveBeenCalledTimes(1));
    expect(signInMock).toHaveBeenCalledWith({
      email: 'ana@foundly.dev',
      password: 'mock-credential',
    });
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/admin/agenda'),
    );
  });

  it('shows an inline error for invalid credentials', async () => {
    signInMock.mockResolvedValue({
      ok: false,
      error: { code: 'UNAUTHENTICATED', message: 'Email o contraseña incorrectos.' },
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Email/), 'ana@foundly.dev');
    await user.type(screen.getByLabelText(/Contraseña/), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.');
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('explains the bounce when the session expired (feature 012)', () => {
    renderForm(true);
    expect(screen.getByRole('status')).toHaveTextContent(/sesión ha caducado/i);
  });
});
