'use client';

import { useState } from 'react';
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
import {
  GLASS_CARD_SX,
  PRIMARY_BUTTON_SX,
  SECONDARY_BUTTON_SX,
} from '../../../shared/utils/landingCanon';
import { addGalleryPhoto, removeGalleryPhoto } from '../utils/actions';

interface GalleryManagerProps {
  gallery: GalleryPhoto[];
}

const URL_PATTERN = /^https?:\/\/.+/i;

/** Galería view: glass card grid + add modal + lightbox + confirmed removal (006). */
export function GalleryManager({ gallery }: GalleryManagerProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(gallery);
  const [opened, setOpened] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GalleryCategory | undefined>(undefined);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<GalleryPhoto | null>(null);
  const [preview, setPreview] = useState<GalleryPhoto | null>(null);

  function open() {
    setUrl('');
    setTitle('');
    setDescription('');
    setCategory(undefined);
    setUrlError(null);
    setFormError(null);
    setOpened(true);
  }

  function close() {
    setOpened(false);
  }

  function add() {
    if (!URL_PATTERN.test(url.trim())) {
      setUrlError('La URL de la imagen es inválida.');
      return;
    }
    const result = addGalleryPhoto({ url, title, description, category });
    if (!result.ok) {
      setUrlError(result.error.fields?.url ?? null);
      setFormError(result.error.fields?.url ? null : result.error.message);
      return;
    }
    setPhotos(result.data);
    setOpened(false);
  }

  function confirmRemove() {
    if (!removeTarget) return;
    const result = removeGalleryPhoto({ id: removeTarget.id });
    if (result.ok) {
      setPhotos(result.data);
    }
    setRemoveTarget(null);
  }

  return (
    <Card
      header={
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.25}>
              <Typography variant="h5" component="h1">
                Galería
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fotos del local y de tus trabajos. Se muestran en la sección «Galería» de tu
                mini-sitio.
              </Typography>
            </Stack>
            <Button variant="primary" sx={PRIMARY_BUTTON_SX} onClick={open}>
              + Añadir imagen
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Los cambios se reflejan al instante en la vista pública del negocio.
          </Typography>
        </Stack>
      }
    >
      {photos.length > 0 ? (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
          {photos.map((photo) => (
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
              <Stack spacing={1}>
                <Box
                  component="img"
                  src={photo.url}
                  alt="Foto de la galería"
                  sx={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                  }}
                />
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
                  <Stack sx={{ alignItems: 'flex-start' }}>
                    <Badge pill status="neutral">
                      {GALLERY_CATEGORY_LABELS[photo.category]}
                    </Badge>
                  </Stack>
                ) : null}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="secondary"
                    sx={SECONDARY_BUTTON_SX}
                    onClick={() => setPreview(photo)}
                  >
                    Ver
                  </Button>
                  <Button
                    variant="secondary"
                    sx={SECONDARY_BUTTON_SX}
                    onClick={() => setRemoveTarget(photo)}
                  >
                    Quitar foto
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Todavía no has añadido fotos. Súbelas para completar la galería de tu negocio.
        </Typography>
      )}

      {opened ? (
        <Modal open onClose={close} title="Añadir imagen">
          <Stack spacing={1.5} sx={{ pt: 1, minWidth: { xs: 0, sm: 460 } }}>
            <TextField
              label="URL de la imagen"
              placeholder="https://…"
              value={url}
              onChange={setUrl}
              error={Boolean(urlError)}
              helperText={urlError ?? undefined}
              fullWidth
            />
            <TextField label="Título (opcional)" value={title} onChange={setTitle} fullWidth />
            <TextField
              label="Descripción (opcional)"
              value={description}
              onChange={setDescription}
              multiline
              rows={2}
              maxLength={250}
              helperText={`${description.length}/250`}
              fullWidth
            />
            <Stack spacing={0.75}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Categoría (opcional)
              </Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {GALLERY_CATEGORIES.map((option) => {
                  const selected = category === option;
                  return (
                    <Chip
                      key={option}
                      label={GALLERY_CATEGORY_LABELS[option]}
                      selectable
                      selected={selected}
                      onClick={() => setCategory(selected ? undefined : option)}
                    />
                  );
                })}
              </Stack>
            </Stack>
            {formError ? (
              <Typography variant="body2" color="error">
                {formError}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button variant="secondary" onClick={close}>
                Cancelar
              </Button>
              <Button variant="primary" sx={PRIMARY_BUTTON_SX} onClick={add}>
                Añadir
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}

      {preview ? (
        <Modal open onClose={() => setPreview(null)} title={preview.title ?? 'Vista previa'}>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Box
              component="img"
              src={preview.url}
              alt="Vista previa de la foto"
              sx={{ width: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 2 }}
            />
            {preview.description ? (
              <Typography variant="body2" color="text.secondary">
                {preview.description}
              </Typography>
            ) : null}
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="secondary" onClick={() => setPreview(null)}>
                Cerrar
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}

      {removeTarget ? (
        <AlertDialog
          open
          title="Quitar imagen"
          description="Esta foto dejará de mostrarse en la galería pública del negocio."
          confirmLabel="Sí, quitar"
          cancelLabel="Cancelar"
          tone="destructive"
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      ) : null}
    </Card>
  );
}
