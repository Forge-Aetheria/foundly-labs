import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders a labelled control and reports checked changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} label="Corte de cabello" />);

    const control = screen.getByLabelText('Corte de cabello');
    expect(control).toBeInTheDocument();
    await user.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is controlled from the checked prop', () => {
    const { rerender } = render(<Checkbox checked={false} label="Manicura" />);
    const control = screen.getByLabelText('Manicura');
    expect(control).not.toBeChecked();
    rerender(<Checkbox checked label="Manicura" />);
    expect(screen.getByLabelText('Manicura')).toBeChecked();
  });
});