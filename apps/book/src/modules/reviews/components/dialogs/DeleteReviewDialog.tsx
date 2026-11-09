import { AlertDialog } from '@foundly/ui';

export interface DeleteReviewDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation dialog for deleting a review. */
export function DeleteReviewDialog({ open, onConfirm, onCancel }: DeleteReviewDialogProps) {
  return (
    <AlertDialog
      open={open}
      title="Eliminar reseña"
      description="¿Seguro que quieres eliminar esta reseña? No se puede deshacer."
      confirmLabel="Sí, eliminar"
      cancelLabel="Cancelar"
      tone="destructive"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
