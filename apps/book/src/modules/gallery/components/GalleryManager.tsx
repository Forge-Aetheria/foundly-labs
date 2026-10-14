'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import {
  AlertDialog,
  Badge,
  Button,
  Card,
  Chip,
  Modal,
  Stack,
  TextField,
  Typography,
} from '@foundly/ui';
import {
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABELS,
  type GalleryCategory,
  type GalleryPhoto,
} from '../../../shared/types/tenancy';
import { GLASS_CARD_SX } from '../../../shared/utils/landingCanon';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { useAddGalleryItem, useRemoveGalleryItem } from '../hooks';

export interface GalleryManagerProps {
  /** Gallery photos read from the backend (feature 013). */
  photos: GalleryPhoto[];
  /** Backend/load error surfaced cleanly (no raw text). */
  error?: string | null;
}

interface Draft {
  url: string;
  title: string;
  description: string;
  category: GalleryCategory | '';
}

const EMPTY_DRAFT: Draft = { url: '', title: '', description: '', category: '' };

/** Galería (feature 013): real grid + add modal + lightbox + delete confirmation. */
export function GalleryManager({ photos, error }: GalleryManagerProps) {
  const [items, setItems] = useState<GalleryPhoto[]>(photos);
  const [draft, setDraft] = useState<{ open: boolean; value: Draft }>({
    open: false,
    value: EMPTY_DRAFT,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<GalleryPhoto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryPhoto | null>(null);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const router = useRouter();
  const toast = useToast();
  const { pending: saving, run } = useAsyncAction();
  const addItem = useAddGalleryItem();
  const removeItem = useRemoveGalleryItem();

  function openAdd() {
    setFieldErrors(null);
    setDraft({ open: true, value: EMPTY_DRAFT });
  }

  function closeAdd() {
    setDraft((prev) => ({ ...prev, open: false }));
  }

  function patch(value: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, value: { ...prev.value, ...value } }));
  }

  function markBroken(id: string) {
    setBroken((prev) => new Set(prev).add(id));
  }

  async function save() {
    setFieldErrors(null);
    setActionNotice(null);
    const value = draft.value;
    if (!value.url.trim() || !value.url.trim().match(/^https?:\/\//i)) {
      setFieldErrors({ url: 'Introduce una URL válida (http o https).' });
      return;
    }
    const result = await run(() =>
      addItem({
        url: value.url.trim(),
        title: value.title,
        description: value.description,
        category: value.category || undefined,
      }),
    );
    if (!result) return;
    if (!result.ok) {
      if (result.error.fields) {
        setFieldErrors(result.error.fields);
      } else {
        setActionNotice(result.error.message);
      }
      return;
    }
    setItems((prev) => [...prev, result.data]);
    closeAdd();
    toast.success('Foto añadida.');
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const result = await run(() => removeItem({ id: target.id }));
    if (result?.ok) {
      setItems((prev) => prev.filter((item) => item.id !== target.id));
      toast.success('Foto eliminada.');
      router.refresh();
    } else if (result && !result.ok) {
      setActionNotice(result.error.message);
    }
    setDeleteTarget(null);
  }

  return (
    <Stack spacing={3}>
      <ApiErrorDialog title="No se pudo cargar la galería" message={error} />
      <ApiErrorDialog title="No se pudo completar la acción" message={actionNotice} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack spacing={0.25}>
          <Typography variant="h5" component="h1">
            Galería
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fotos del negocio que se muestran en la vista pública.
          </Typography>
        </Stack>
        <Button variant="primary" onClick={openAdd}>
          + Añadir imagen
        </Button>
      </Stack>

      {items.length > 0 ? (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
          {items.map((photo) => (
            <Card
              key={photo.id}
              sx={[
                GLASS_CARD_SX,
                { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 12px)' } },
              ]}
            >
              <Stack spacing={1.5}>
                {broken.has(photo.id) ? (
                  <Stack
                    sx={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                      p: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" align="center">
                      No se pudo cargar la imagen.
                    </Typography>
                  </Stack>
                ) : (
                  <Box
                    component="img"
                    src={photo.url}
                    alt={photo.title ?? 'Foto de la galería'}
                    onError={() => markBroken(photo.id)}
                    sx={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  />
                )}
                <Stack spacing={0.5}>
                  {photo.title ? (
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {photo.title}
                    </Typography>
                  ) : null}
                  {photo.description ? (
                    <Typography variant="body2" color="text.secondary">
                      {photo.description}
                    </Typography>
                  ) : null}
                  {photo.category ? (
                    <Badge pill status="neutral">
                      {GALLERY_CATEGORY_LABELS[photo.category]}
                    </Badge>
                  ) : null}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Button variant="secondary" onClick={() => setPreview(photo)}>
                    Ver
                  </Button>
                  <Button variant="destructive" onClick={() => setDeleteTarget(photo)}>
                    Quitar foto
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card sx={GLASS_CARD_SX}>
          <Stack spacing={1} alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" component="h2">
              Todavía no hay fotos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Añade tu primera imagen con «+ Añadir imagen».
            </Typography>
          </Stack>
        </Card>
      )}

      {draft.open ? (
        <Modal open onClose={closeAdd} title="Añadir imagen">
          <Stack spacing={2} sx={{ pt: 1, minWidth: { xs: 0, sm: 460 } }}>
            <TextField
              label="URL de la imagen"
              placeholder="https://…"
              value={draft.value.url}
              onChange={(value) => patch({ url: value })}
              error={Boolean(fieldErrors?.url)}
              helperText={fieldErrors?.url}
              required
              fullWidth
            />
            <TextField
              label="Título (opcional)"
              value={draft.value.title}
              onChange={(value) => patch({ title: value })}
              error={Boolean(fieldErrors?.title)}
              helperText={fieldErrors?.title}
              maxLength={200}
              fullWidth
            />
            <TextField
              label="Descripción (opcional)"
              value={draft.value.description}
              onChange={(value) => patch({ description: value })}
              error={Boolean(fieldErrors?.description)}
              helperText={fieldErrors?.description}
              multiline
              rows={3}
              maxLength={2000}
              fullWidth
            />
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Categoría (opcional)
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip
                  label="Sin categoría"
                  selectable
                  selected={draft.value.category === ''}
                  onClick={() => patch({ category: '' })}
                />
                {GALLERY_CATEGORIES.map((category) => (
                  <Chip
                    key={category}
                    label={GALLERY_CATEGORY_LABELS[category]}
                    selectable
                    selected={draft.value.category === category}
                    onClick={() => patch({ category })}
                  />
                ))}
              </Stack>
            </Stack>
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
              <Button variant="secondary" onClick={closeAdd} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={save} loading={saving}>
                Guardar foto
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}

      {preview ? (
        <Modal open onClose={() => setPreview(null)} title={preview.title ?? 'Vista previa'}>
          <Box
            component="img"
            src={preview.url}
            alt={preview.title ?? 'Foto de la galería'}
            sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 2 }}
          />
        </Modal>
      ) : null}

      {deleteTarget ? (
        <AlertDialog
          open
          title="Quitar foto"
          description="¿Seguro que quieres quitar esta foto de la galería? Dejará de aparecer en la vista pública."
          confirmLabel="Sí, quitar"
          cancelLabel="Cancelar"
          tone="destructive"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </Stack>
  );
}
