import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test-utils/a11y';
import { FoundlyThemeProvider } from '../../theme';
import { Button } from './Button';

describe('Button', () => {
  it('renders each variant and is keyboard-activatable', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <FoundlyThemeProvider>
        <Button variant="primary" onClick={onClick}>
          Primary
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
      </FoundlyThemeProvider>,
    );

    const primary = screen.getByRole('button', { name: 'Primary' });
    primary.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Destructive' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('supports disabled and loading states', () => {
    render(
      <FoundlyThemeProvider>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </FoundlyThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
  });

  it('forwards sx overrides (e.g. glass surface)', () => {
    render(
      <FoundlyThemeProvider>
        <Button variant="secondary" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
          Glass
        </Button>
      </FoundlyThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Glass' })).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    });
  });
});
