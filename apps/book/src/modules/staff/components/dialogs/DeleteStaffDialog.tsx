import { AlertDialog } from '@foundly/ui';

export interface DeleteStaffDialogProps {
  open: boolean;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation dialog for removing a staff member. */
export function DeleteStaffDialog({
  open,
  description,
  onConfirm,
  onCancel,
}: DeleteStaffDialogProps) {
  return (
    <AlertDialog
      open={open}
      title="Eliminar profesional"
      description={description}
      confirmLabel="Sí, eliminar"
      cancelLabel="Cancelar"
      tone="destructive"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
