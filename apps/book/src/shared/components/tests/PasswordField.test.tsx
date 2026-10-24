import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { PasswordField } from '../PasswordField';

describe('PasswordField', () => {
  it('toggles the input type and keeps emitting values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FoundlyThemeProvider>
        <PasswordField label="Contraseña" value="" onChange={onChange} />
      </FoundlyThemeProvider>,
    );

    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');

    await user.type(input, 'secreto123');
    expect(onChange).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
  });
});