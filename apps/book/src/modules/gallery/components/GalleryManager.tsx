'use client';

import { useState } from 'react';
import { useRouter } from '@/shared/compat/useAppRouter';
import Box from '@mui/material/Box';
import { Badge, Button, Card, Stack, Typography } from '@foundly/ui';
import { GALLERY_CATEGORY_LABELS, type GalleryPhoto } from '../../../shared/types/tenancy';
import { GLASS_CARD_SX } from '../../../shared/utils/landingCanon';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { useAddGalleryItem, useRemoveGalleryItem, useUploadGalleryPhoto } from '../hooks';
import { AddGalleryDialog, type GalleryDraft } from './dialogs/AddGalleryDialog';
import { GalleryPreviewDialog } from './dialogs/GalleryPreviewDialog';
import { DeleteGalleryItemDialog } from './dialogs/DeleteGalleryItemDialog';

export interface GalleryManagerProps {
  /** Gallery photos read from the backend (feature 013). */
  photos: GalleryPhoto[];
  /** Tenant scope for media uploads (feature 021); uploads disabled when empty. */
  tenantId?: string;
  /** Backend/load error surfaced cleanly (no raw text). */
  error?: string | null;
}

const EMPTY_DRAFT: GalleryDraft = { url: '', title: '', description: '', category: '' };

/** Galería (feature 013): real grid + add modal + lightbox + delete confirmation. */
export function GalleryManager({ photos, tenantId, error }: GalleryManagerProps) {
  const [items, setItems] = useState<GalleryPhoto[]>(photos);
  const [draft, setDraft] = useState<{ open: boolean; value: GalleryDraft }>({
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
  const uploadPhoto = useUploadGalleryPhoto(tenantId ?? '');

  function openAdd() {
    setFieldErrors(null);
    setDraft({ open: true, value: EMPTY_DRAFT });
  }

  function closeAdd() {
    setDraft((prev) => ({ ...prev, open: false }));
  }

  function patch(value: Partial<GalleryDraft>) {
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
                {
                  flex: {
                    xs: '1 1 100%',
                    sm: '1 1 calc(50% - 8px)',
                    md: '1 1 calc(33.333% - 12px)',
                  },
                },
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

      <AddGalleryDialog
        open={draft.open}
        value={draft.value}
        fieldErrors={fieldErrors}
        saving={saving}
        onClose={closeAdd}
        onPatch={patch}
        onSave={save}
        onUpload={uploadPhoto}
      />

      <GalleryPreviewDialog
        open={Boolean(preview)}
        title={preview?.title}
        url={preview?.url ?? ''}
        onClose={() => setPreview(null)}
      />

      <DeleteGalleryItemDialog
        open={Boolean(deleteTarget)}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Stack>
  );
}
