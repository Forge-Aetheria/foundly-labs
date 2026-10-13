import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';

const { changePasswordMock } = vi.hoisted(() => ({ changePasswordMock: vi.fn() }));

vi.mock('../../../shared/infra/securityActions', () => ({ changePassword: changePasswordMock }));

import { PasswordForm } from '../components/PasswordForm';

describe('PasswordForm (009 — US5)', () => {
  beforeEach(() => {
    changePasswordMock.mockReset();
  });

  it('shows a success confirmation on a valid change', async () => {
    changePasswordMock.mockResolvedValue({ ok: true, data: { updated: true } });
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <PasswordForm />
      </FoundlyThemeProvider>,
    );

    await user.type(screen.getByLabelText(/Contraseña actual/), 'mock-credential');
    await user.type(screen.getByLabelText(/^Nueva contraseña/), 'nueva1234');
    await user.type(screen.getByLabelText(/Repite la nueva contraseña/), 'nueva1234');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(changePasswordMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('status')).toHaveTextContent('Contraseña actualizada');
  });

  it('shows an inline error when the current password is wrong', async () => {
    changePasswordMock.mockResolvedValue({
      ok: false,
      error: { code: 'UNAUTHENTICATED', message: 'La contraseña actual no es correcta.' },
    });
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <PasswordForm />
      </FoundlyThemeProvider>,
    );

    await user.type(screen.getByLabelText(/Contraseña actual/), 'wrong');
    await user.type(screen.getByLabelText(/^Nueva contraseña/), 'nueva1234');
    await user.type(screen.getByLabelText(/Repite la nueva contraseña/), 'nueva1234');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual no es correcta.');
  });
});
