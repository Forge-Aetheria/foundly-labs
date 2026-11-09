import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '../AppProviders';
import { useToast } from '../../shared/components/Toaster';

function ToastProbe() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.success('Toast disponible')}>
      Probar toast
    </button>
  );
}

describe('AppProviders', () => {
  it('provides the global toast context', async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <ToastProbe />
      </AppProviders>,
    );

    await user.click(screen.getByRole('button', { name: 'Probar toast' }));
    expect(screen.getByText('Toast disponible')).toBeInTheDocument();
  });
});
