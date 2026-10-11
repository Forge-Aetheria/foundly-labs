import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders a labelled control and reports checked changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Activo" />);

    const control = screen.getByLabelText('Activo');
    expect(control).toBeInTheDocument();
    await user.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is controlled from the checked prop', () => {
    const { rerender } = render(<Switch checked label="Activo" />);
    expect(screen.getByLabelText('Activo')).toBeChecked();
    rerender(<Switch checked={false} label="Activo" />);
    expect(screen.getByLabelText('Activo')).not.toBeChecked();
  });
});