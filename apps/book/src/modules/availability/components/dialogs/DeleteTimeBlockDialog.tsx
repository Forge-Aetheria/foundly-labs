import { AlertDialog } from '@foundly/ui';

export interface DeleteTimeBlockDialogProps {
  open: boolean;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation dialog for removing an availability time block. */
export function DeleteTimeBlockDialog({
  open,
  description,
  onConfirm,
  onCancel,
}: DeleteTimeBlockDialogProps) {
  return (
    <AlertDialog
      open={open}
      title="Desbloquear franja"
      description={description}
      confirmLabel="Sí, desbloquear"
      cancelLabel="Cancelar"
      tone="destructive"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
