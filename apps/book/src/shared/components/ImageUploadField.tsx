'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Box from '@mui/material/Box';
import { Button, Stack, TextField, Typography } from '@foundly/ui';
import type { ActionResult } from '../types/result';
import { ACCEPTED_IMAGE_TYPES, validateImageFile } from '../utils/uploadImage';

export type ImagePreviewShape = 'square' | 'circle' | 'banner';
export type ImageUploadLayout = 'row' | 'column';

export interface ImageUploadFieldProps {
  /** Field heading / base name; also the file input's accessible name (`Subir {label}`). */
  label: string;
  /** Current image URL (empty string when unset). */
  value: string;
  /** Emitted on a successful upload and on every URL edit/clear. */
  onChange: (url: string) => void;
  /** Injected uploader (module hook). The control never imports storage directly. */
  onUpload: (file: File) => Promise<ActionResult<{ url: string }>>;
  /** Guidance text or field error surfaced under the URL input. */
  helperText?: string;
  /** Error styling for the URL input. */
  error?: boolean;
  /** Preview shape (default `square`). */
  preview?: ImagePreviewShape;
  /** `row` (preview beside controls) or `column` (preview on top, controls below). */
  layout?: ImageUploadLayout;
  /** Hide the internal heading (when the parent supplies its own card title). */
  hideLabel?: boolean;
  /** Label of the URL fallback input (default `${label} (URL)`). */
  urlLabel?: string;
  urlPlaceholder?: string;
  disabled?: boolean;
}

const ROW_PREVIEW_SX: Record<ImagePreviewShape, object> = {
  square: { width: 96, height: 96, borderRadius: 2 },
  circle: { width: 88, height: 88, borderRadius: '50%' },
  banner: { width: { xs: '100%', sm: 240 }, aspectRatio: '3 / 1', borderRadius: 2 },
};

const COLUMN_PREVIEW_SX: Record<ImagePreviewShape, object> = {
  square: { width: 128, height: 128, borderRadius: 2 },
  circle: { width: 112, height: 112, borderRadius: '50%' },
  banner: { width: '100%', aspectRatio: '3 / 1', borderRadius: 2 },
};

/**
 * Reusable media control (features 021/022): file picker + drag & drop + immediate
 * preview, with the URL text input kept as a manual alternative. One component is
 * shared by profile (logo/cover), staff (avatar) and gallery (photo).
 *
 * `layout="column"` stacks the preview above the upload zone + URL field (used by the
 * profile cards); `layout="row"` (default) keeps the compact side-by-side variant.
 *
 * Placed in `apps/book/src/shared/components` rather than `packages/ui` because it is
 * a client component (file input / drag & drop state); see code-rules §8.2.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  onUpload,
  helperText,
  error = false,
  preview = 'square',
  layout = 'row',
  hideLabel = false,
  urlLabel,
  urlPlaceholder = 'https://…',
  disabled = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    setLocalError(null);
    if (!file) return;
    const valid = validateImageFile(file);
    if (!valid.ok) {
      setLocalError(valid.message);
      return;
    }
    setBusy(true);
    const result = await onUpload(file);
    setBusy(false);
    if (!result.ok) {
      setLocalError(result.error.message);
      return;
    }
    onChange(result.data.url);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled || busy) return;
    void handleFile(event.dataTransfer.files?.[0]);
  }

  const trimmed = value.trim();
  const urlError = error || Boolean(localError);
  const previewSx = layout === 'column' ? COLUMN_PREVIEW_SX[preview] : ROW_PREVIEW_SX[preview];

  const previewNode = trimmed ? (
    <Box
      component="img"
      src={trimmed}
      alt={`Vista previa de ${label}`}
      sx={[previewSx, { objectFit: 'cover', border: 1, borderColor: 'divider', flexShrink: 0 }]}
    />
  ) : layout === 'column' ? (
    <Box
      sx={[
        previewSx,
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed',
          borderColor: 'border.lavender',
          backgroundColor: 'background.default',
        },
      ]}
    >
      <Typography variant="caption" color="text.secondary">
        Sin imagen
      </Typography>
    </Box>
  ) : null;

  const controls = (
    <Stack spacing={1} sx={layout === 'row' ? { flexGrow: 1, minWidth: { xs: 0, sm: 240 } } : { width: '100%' }}>
      <Box
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1.5,
          borderRadius: 2,
          border: 1,
          borderStyle: 'dashed',
          borderColor: dragging ? 'primary.main' : 'divider',
        }}
      >
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
        >
          {busy ? 'Subiendo…' : 'Subir imagen'}
        </Button>
        <Typography variant="caption" color="text.secondary">
          Arrastra una imagen aquí o usa el botón (PNG, JPG o WEBP, máx. 5 MB).
        </Typography>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          aria-label={`Subir ${label}`}
          onChange={handleInput}
          disabled={disabled || busy}
        />
      </Box>
      <TextField
        label={urlLabel ?? `${label} (URL)`}
        placeholder={urlPlaceholder}
        value={value}
        onChange={onChange}
        error={urlError}
        helperText={localError ?? helperText}
        disabled={disabled}
        fullWidth
      />
    </Stack>
  );

  const heading = hideLabel ? null : (
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {label}
    </Typography>
  );

  if (layout === 'column') {
    return (
      <Stack spacing={1.5}>
        {heading}
        {previewNode}
        {controls}
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {heading}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
        {previewNode}
        {controls}
      </Stack>
    </Stack>
  );
}
