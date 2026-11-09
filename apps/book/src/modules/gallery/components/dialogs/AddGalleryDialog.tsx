import { Button, Chip, Modal, Stack, TextField, Typography } from '@foundly/ui';
import { ImageUploadField } from '../../../../shared/components/ImageUploadField';
import type { ActionResult } from '../../../../shared/types/result';
import {
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABELS,
  type GalleryCategory,
} from '../../../../shared/types/tenancy';

export interface GalleryDraft {
  url: string;
  title: string;
  description: string;
  category: GalleryCategory | '';
}

export interface AddGalleryDialogProps {
  open: boolean;
  value: GalleryDraft;
  fieldErrors: Record<string, string> | null;
  saving: boolean;
  onClose: () => void;
  onPatch: (value: Partial<GalleryDraft>) => void;
  onSave: () => void;
  onUpload: (file: File) => Promise<ActionResult<{ url: string }>>;
}

/** Add-photo modal for the gallery (feature 013/021). */
export function AddGalleryDialog({
  open,
  value,
  fieldErrors,
  saving,
  onClose,
  onPatch,
  onSave,
  onUpload,
}: AddGalleryDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Añadir imagen">
      <Stack spacing={2} sx={{ pt: 1, minWidth: { xs: 0, sm: 460 } }}>
        <ImageUploadField
          label="Foto"
          preview="square"
          urlLabel="URL de la imagen"
          value={value.url}
          onChange={(url) => onPatch({ url })}
          onUpload={onUpload}
          error={Boolean(fieldErrors?.url)}
          helperText={fieldErrors?.url}
        />
        <TextField
          label="Título (opcional)"
          value={value.title}
          onChange={(title) => onPatch({ title })}
          error={Boolean(fieldErrors?.title)}
          helperText={fieldErrors?.title}
          maxLength={200}
          fullWidth
        />
        <TextField
          label="Descripción (opcional)"
          value={value.description}
          onChange={(description) => onPatch({ description })}
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
              selected={value.category === ''}
              onClick={() => onPatch({ category: '' })}
            />
            {GALLERY_CATEGORIES.map((category) => (
              <Chip
                key={category}
                label={GALLERY_CATEGORY_LABELS[category]}
                selectable
                selected={value.category === category}
                onClick={() => onPatch({ category })}
              />
            ))}
          </Stack>
        </Stack>
        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSave} loading={saving}>
            Guardar foto
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
