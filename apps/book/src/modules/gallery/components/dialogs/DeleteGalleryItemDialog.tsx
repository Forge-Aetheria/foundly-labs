import { AlertDialog } from '@foundly/ui';

export interface DeleteGalleryItemDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation dialog for removing a gallery photo. */
export function DeleteGalleryItemDialog({
  open,
  onConfirm,
  onCancel,
}: DeleteGalleryItemDialogProps) {
  return (
    <AlertDialog
      open={open}
      title="Quitar foto"
      description="¿Seguro que quieres quitar esta foto de la galería? Dejará de aparecer en la vista pública."
      confirmLabel="Sí, quitar"
      cancelLabel="Cancelar"
      tone="destructive"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
