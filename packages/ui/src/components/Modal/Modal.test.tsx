import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '../../theme';
import { Button } from '../Button';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders when open and closes via an action', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <FoundlyThemeProvider>
        <Modal
          open
          onClose={onClose}
          title="Confirmar reserva"
          actions={
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          }
        >
          Contenido del modal
        </Modal>
      </FoundlyThemeProvider>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Contenido del modal')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses with ESC by default', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <FoundlyThemeProvider>
        <Modal open onClose={onClose} title="Aviso">
          Cuerpo
        </Modal>
      </FoundlyThemeProvider>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('can disable ESC dismissal', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <FoundlyThemeProvider>
        <Modal open onClose={onClose} title="Bloqueado" disableEscapeClose>
          Cuerpo
        </Modal>
      </FoundlyThemeProvider>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies a glassmorphism surface when glass is set', () => {
    render(
      <FoundlyThemeProvider>
        <Modal open onClose={() => {}} title="Reserva" glass>
          Glass
        </Modal>
      </FoundlyThemeProvider>,
    );
    const paper = document.querySelector('.MuiDialog-paper');
    expect(paper).not.toBeNull();
    expect(paper).toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.85)' });
  });

  it('keeps the solid surface by default', () => {
    render(
      <FoundlyThemeProvider>
        <Modal open onClose={() => {}} title="Reserva">
          Sólido
        </Modal>
      </FoundlyThemeProvider>,
    );
    const paper = document.querySelector('.MuiDialog-paper');
    expect(paper).not.toBeNull();
    expect(paper).not.toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.85)' });
  });
});
