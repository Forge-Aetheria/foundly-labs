import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { ToastProvider } from '../../../shared/components/Toaster';
import type { Review } from '../../../shared/types/tenancy';
import { ReviewModerationList } from '../components/ReviewModerationList';

const { setMock, deleteMock } = vi.hoisted(() => ({ setMock: vi.fn(), deleteMock: vi.fn() }));

vi.mock('../hooks', () => ({
  useFetchMyReviews: () => vi.fn(),
  useSetReviewState: () => setMock,
  useDeleteReview: () => deleteMock,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const reviews: Review[] = [
  { id: 'r1', tenantId: 'ten-ana', author: 'Ana', rating: 5, comment: 'Genial', date: '2026-10-13T10:00:00.000Z', state: 'pending' },
  { id: 'r2', tenantId: 'ten-ana', author: 'Luis', rating: 4, comment: 'Bien', date: '2026-10-12T10:00:00.000Z', state: 'approved' },
];

function renderList(items: Review[] = reviews) {
  return render(
    <FoundlyThemeProvider>
      <ToastProvider>
        <ReviewModerationList reviews={items} />
      </ToastProvider>
    </FoundlyThemeProvider>,
  );
}

describe('ReviewModerationList (feature 015/016, US3)', () => {
  beforeEach(() => {
    setMock.mockReset();
    deleteMock.mockReset();
  });

  it('lists reviews with pending flagged and filters by state', async () => {
    const { container } = renderList();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Aprobada').length).toBeGreaterThan(0);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Pendiente' }));
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Luis')).not.toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('shows a clean empty state', () => {
    renderList([]);
    expect(screen.getByText('No hay reseñas')).toBeInTheDocument();
  });

  it('approves a review through the hook and shows a success toast', async () => {
    setMock.mockResolvedValue({ ok: true, data: { ...reviews[0], state: 'approved' } });
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getAllByRole('button', { name: 'Aprobar' })[0]!);

    expect(setMock).toHaveBeenCalledWith({ id: 'r1', state: 'approved' });
    expect(await screen.findByText('Reseña aprobada.')).toBeInTheDocument();
  });

  it('deletes a review after confirming the dialog', async () => {
    deleteMock.mockResolvedValue({ ok: true, data: { id: 'r1' } });
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]!);
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(deleteMock).toHaveBeenCalledWith({ id: 'r1' });
    expect(await screen.findByText('Reseña eliminada.')).toBeInTheDocument();
  });
});
