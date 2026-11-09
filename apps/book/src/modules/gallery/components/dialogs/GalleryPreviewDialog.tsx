import Box from '@mui/material/Box';
import { Modal } from '@foundly/ui';

export interface GalleryPreviewDialogProps {
  open: boolean;
  title?: string | null;
  url: string;
  onClose: () => void;
}

/** Lightbox preview for a gallery photo. */
export function GalleryPreviewDialog({ open, title, url, onClose }: GalleryPreviewDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title ?? 'Vista previa'}>
      <Box
        component="img"
        src={url}
        alt={title ?? 'Foto de la galería'}
        sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 2 }}
      />
    </Modal>
  );
}
