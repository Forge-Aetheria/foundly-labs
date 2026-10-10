'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import {
  AlertDialog,
  Button,
  Card,
  Modal,
  Stack,
  TextField,
  Typography,
} from '@foundly/ui';
import { addGalleryImage, removeGalleryImage } from '../actions';

interface GalleryManagerProps {
  gallery: string[];
}

/** Galería view: manage the photos shown on the public landing (US4 storefront). */
export function GalleryManager({ gallery }: GalleryManagerProps) {
  const [images, setImages] = useState<string[]>(gallery);
  const [opened, setOpened] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  function open() {
    setUrl('');
    setError(null);
    setOpened(true);
  }

  function close() {
    setOpened(false);
  }

  function add() {
    const result = addGalleryImage({ url });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setImages(result.data);
    setOpened(false);
  }

  function confirmRemove() {
    if (!removeTarget) return;
    const result = removeGalleryImage({ url: removeTarget });
    if (result.ok) {
      setImages(result.data);
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
            <Button variant="primary" onClick={open}>
              + Añadir imagen
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Los cambios se reflejan al instante en la vista pública del negocio.
          </Typography>
        </Stack>
      }
    >
      {images.length > 0 ? (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          {images.map((src) => (
            <Stack
              key={src}
              spacing={1}
              sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: { xs: '45%', md: 220 } }}
            >
              <Box
                component="img"
                src={src}
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
              <Button variant="secondary" fullWidth onClick={() => setRemoveTarget(src)}>
                Quitar foto
              </Button>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Todavía no has añadido fotos. Súbelas para completar la galería de tu negocio.
        </Typography>
      )}

      {opened ? (
        <Modal open onClose={close} title="Añadir imagen">
          <Stack spacing={1.5} sx={{ pt: 1, minWidth: { xs: 0, sm: 420 } }}>
            <TextField
              label="URL de la imagen"
              placeholder="https://…"
              value={url}
              onChange={setUrl}
              error={Boolean(error)}
              fullWidth
            />
            {error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button variant="secondary" onClick={close}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={add}>
                Añadir
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