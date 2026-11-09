import { AlertDialog } from '@foundly/ui';

export interface DeleteServiceDialogProps {
  open: boolean;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation dialog for deleting a service. */
export function DeleteServiceDialog({
  open,
  description,
  onConfirm,
  onCancel,
}: DeleteServiceDialogProps) {
  return (
    <AlertDialog
      open={open}
      title="Eliminar servicio"
      description={description}
      confirmLabel="Sí, eliminar"
      cancelLabel="Cancelar"
      tone="destructive"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
