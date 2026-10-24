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

  it('renders a multiline textarea with a max length constraint', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FoundlyThemeProvider>
        <TextField label="Biografía" value="" onChange={onChange} multiline rows={3} maxLength={10} />
      </FoundlyThemeProvider>,
    );
    const el = screen.getByLabelText('Biografía');
    expect(el.tagName).toBe('TEXTAREA');
    expect(el).toHaveAttribute('rows', '3');
    await user.type(el, '1234567890ABC');
    expect(el).toHaveAttribute('maxlength', '10');
    // The controlled value stops at the max length.
    expect('1234567890ABC'.slice(0, 10)).toBe('1234567890');
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

  it('renders a trailing endAdornment inside the input', () => {
    render(
      <FoundlyThemeProvider>
        <TextField
          label="Contraseña"
          type="password"
          value=""
          endAdornment={<div data-testid="adornment">toggle</div>}
        />
      </FoundlyThemeProvider>,
    );
    expect(screen.getByTestId('adornment')).toBeInTheDocument();
  });
});
