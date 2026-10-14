import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { GalleryPhoto } from '../../../shared/types/tenancy';
import { ToastProvider } from '../../../shared/components/Toaster';
import { GalleryManager } from '../components/GalleryManager';

const { addMock, removeMock } = vi.hoisted(() => ({ addMock: vi.fn(), removeMock: vi.fn() }));

vi.mock('../hooks', () => ({
  useAddGalleryItem: () => addMock,
  useRemoveGalleryItem: () => removeMock,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const photos: GalleryPhoto[] = [
  { id: 'g1', url: 'https://example.com/1.jpg', title: 'Fachada', category: 'local' },
  { id: 'g2', url: 'https://example.com/2.jpg', title: 'Corte', category: 'trabajos' },
];

function renderManager(items: GalleryPhoto[] = photos) {
  return render(
    <FoundlyThemeProvider>
      <ToastProvider>
        <GalleryManager photos={items} />
      </ToastProvider>
    </FoundlyThemeProvider>,
  );
}

describe('GalleryManager (admin Galería, feature 013)', () => {
  beforeEach(() => {
    addMock.mockReset();
    removeMock.mockReset();
  });

  it('renders the real photos as cards with title and category badge', async () => {
    const { container } = renderManager();

    expect(screen.getByText('Galería')).toBeInTheDocument();
    expect(screen.getByText('Fachada')).toBeInTheDocument();
    expect(screen.getByText('Corte')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Ver' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Quitar foto' })).toHaveLength(2);

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('shows a friendly empty state when there are no photos', () => {
    renderManager([]);
    expect(screen.getByText('Todavía no hay fotos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Añadir imagen' })).toBeInTheDocument();
  });

  it('adds a photo through the server action', async () => {
    addMock.mockResolvedValue({
      ok: true,
      data: { id: 'g3', url: 'https://example.com/3.jpg', title: 'Nueva' },
    });
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir imagen' }));
    await user.type(screen.getByLabelText(/URL de la imagen/), 'https://example.com/3.jpg');
    await user.type(screen.getByLabelText(/Título/), 'Nueva');
    await user.click(screen.getByRole('button', { name: 'Guardar foto' }));

    expect(await screen.findByText('Nueva')).toBeInTheDocument();
    expect(addMock).toHaveBeenCalledWith({
      url: 'https://example.com/3.jpg',
      title: 'Nueva',
      description: '',
      category: undefined,
    });
  });

  it('blocks saving without a valid URL', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: '+ Añadir imagen' }));
    await user.click(screen.getByRole('button', { name: 'Guardar foto' }));

    expect(screen.getByText('Introduce una URL válida (http o https).')).toBeInTheDocument();
    expect(addMock).not.toHaveBeenCalled();
  });

  it('removes a photo after confirming the dialog', async () => {
    removeMock.mockResolvedValue({ ok: true, data: { id: 'g1' } });
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole('button', { name: 'Quitar foto' })[0]!);
    await user.click(screen.getByRole('button', { name: 'Sí, quitar' }));

    expect(removeMock).toHaveBeenCalledWith({ id: 'g1' });
    expect(screen.queryByText('Fachada')).not.toBeInTheDocument();
  });
});
