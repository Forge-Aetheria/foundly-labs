import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '../../theme';
import { TextField } from './TextField';

describe('TextField', () => {
  it('emits typed values and exposes its label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FoundlyThemeProvider>
        <TextField label="Nombre" value="" onChange={onChange} />
      </FoundlyThemeProvider>,
    );
    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows an error state with helper text', () => {
    render(
      <FoundlyThemeProvider>
        <TextField label="Email" value="x" error helperText="Email inválido" />
      </FoundlyThemeProvider>,
    );
    expect(screen.getByText('Email inválido')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('forwards sx overrides (e.g. layout sizing)', () => {
    render(
      <FoundlyThemeProvider>
        <TextField label="Tu email" value="" sx={{ maxWidth: 320 }} />
      </FoundlyThemeProvider>,
    );
    const root = screen.getByLabelText('Tu email').closest('.MuiTextField-root');
    expect(root).not.toBeNull();
    expect(root).toHaveStyle({ maxWidth: '320px' });
  });
});
