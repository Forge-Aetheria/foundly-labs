import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ToastProvider, useToast } from '../Toaster';

function Trigger() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Guardado')}>ok</button>
      <button onClick={() => toast.error('Fallo')}>err</button>
    </div>
  );
}

function renderToaster() {
  return render(
    <FoundlyThemeProvider>
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    </FoundlyThemeProvider>,
  );
}

describe('Toaster (feature 016, US1)', () => {
  it('shows a success toast with a polite live region and dismisses it', () => {
    renderToaster();
    fireEvent.click(screen.getByRole('button', { name: 'ok' }));

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Guardado');
    expect(toast).toHaveAttribute('aria-live', 'polite');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument();
  });

  it('shows an error toast as an assertive alert', () => {
    renderToaster();
    fireEvent.click(screen.getByRole('button', { name: 'err' }));

    const toast = screen.getByRole('alert');
    expect(toast).toHaveTextContent('Fallo');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  it('auto-hides after the duration', () => {
    vi.useFakeTimers();
    try {
      renderToaster();
      fireEvent.click(screen.getByRole('button', { name: 'ok' }));
      expect(screen.getByText('Guardado')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.queryByText('Guardado')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
