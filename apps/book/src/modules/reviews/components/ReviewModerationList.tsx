'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog, Badge, Button, Card, Chip, Stack, Typography } from '@foundly/ui';
import type { BadgeStatus } from '@foundly/ui';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { GLASS_CARD_SX } from '../../../shared/utils/landingCanon';
import type { Review, ReviewState } from '../../../shared/types/tenancy';
import { useDeleteReview, useSetReviewState } from '../hooks';

export interface ReviewModerationListProps {
  /** The business's reviews read from the backend (any state). */
  reviews: Review[];
  /** Backend/load error surfaced cleanly (no raw text). */
  error?: string | null;
}

type Filter = 'all' | ReviewState;

const FILTERS: readonly Filter[] = ['all', 'pending', 'approved', 'rejected'];

const STATE_LABELS: Record<ReviewState, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const STATE_TONE: Record<ReviewState, BadgeStatus> = {
  pending: 'warning',
  approved: 'positive',
  rejected: 'negative',
};

/** Review moderation surface (feature 015/016): filter + approve/reject/delete. */
export function ReviewModerationList({ reviews, error }: ReviewModerationListProps) {
  const router = useRouter();
  const toast = useToast();
  const setState = useSetReviewState();
  const removeReview = useDeleteReview();
  const { pending: mutating, run } = useAsyncAction();
  const [items, setItems] = useState<Review[]>(reviews);
  const [filter, setFilter] = useState<Filter>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  // Keep the list in sync with the server: `router.refresh()` (and any App Router
  // revalidation) re-renders this Server Component with fresh `reviews`; without
  // this the component would keep the stale snapshot it was mounted with.
  useEffect(() => {
    setItems(reviews);
  }, [reviews]);

  const visible = filter === 'all' ? items : items.filter((review) => review.state === filter);

  async function moderate(review: Review, state: 'approved' | 'rejected') {
    setActionNotice(null);
    const result = await run(() => setState({ id: review.id, state }));
    if (!result) return;
    if (!result.ok) {
      setActionNotice(result.error.message);
      return;
    }
    setItems((prev) => prev.map((row) => (row.id === review.id ? result.data : row)));
    toast.success(state === 'approved' ? 'Reseña aprobada.' : 'Reseña rechazada.');
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setActionNotice(null);
    const result = await run(() => removeReview({ id: target.id }));
    setDeleteTarget(null);
    if (!result) return;
    if (!result.ok) {
      setActionNotice(result.error.message);
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== target.id));
    toast.success('Reseña eliminada.');
    router.refresh();
  }

  return (
    <Stack spacing={3}>
      <ApiErrorDialog title="No se pudieron cargar las reseñas" message={error} />
      <ApiErrorDialog title="No se pudo completar la acción" message={actionNotice} />

      <Stack spacing={0.25}>
        <Typography variant="h5" component="h1">
          Reseñas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aprueba, rechaza o elimina las reseñas de tu negocio. Solo las aprobadas se publican.
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {FILTERS.map((value) => (
          <Chip
            key={value}
            label={value === 'all' ? 'Todas' : STATE_LABELS[value]}
            selectable
            selected={filter === value}
            onClick={() => setFilter(value)}
          />
        ))}
      </Stack>

      {visible.length === 0 ? (
        <Card sx={GLASS_CARD_SX}>
          <Stack spacing={1} alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" component="h2">
              No hay reseñas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cuando tus clientes dejen reseñas, aparecerán aquí para moderarlas.
            </Typography>
          </Stack>
        </Card>
      ) : (
        <Stack spacing={2}>
          {visible.map((review) => (
            <Card key={review.id} sx={GLASS_CARD_SX}>
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {review.author}
                  </Typography>
                  <Badge pill status={STATE_TONE[review.state]}>
                    {STATE_LABELS[review.state]}
                  </Badge>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {review.rating}★ · {new Date(review.date).toLocaleDateString('es-ES')}
                </Typography>
                <Typography variant="body2">{review.comment}</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    disabled={review.state === 'approved' || mutating}
                    onClick={() => moderate(review, 'approved')}
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={review.state === 'rejected' || mutating}
                    onClick={() => moderate(review, 'rejected')}
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={mutating}
                    onClick={() => setDeleteTarget(review)}
                  >
                    Eliminar
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {deleteTarget ? (
        <AlertDialog
          open
          title="Eliminar reseña"
          description="¿Seguro que quieres eliminar esta reseña? No se puede deshacer."
          confirmLabel="Sí, eliminar"
          cancelLabel="Cancelar"
          tone="destructive"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </Stack>
  );
}
