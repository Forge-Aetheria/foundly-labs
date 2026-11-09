import { AlertDialog } from '@foundly/ui';

export interface DeletePaymentMethodDialogProps {
  open: boolean;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation dialog for deleting a payment method. */
export function DeletePaymentMethodDialog({
  open,
  description,
  onConfirm,
  onCancel,
}: DeletePaymentMethodDialogProps) {
  return (
    <AlertDialog
      open={open}
      title="Eliminar método de pago"
      description={description}
      confirmLabel="Sí, eliminar"
      cancelLabel="Cancelar"
      tone="destructive"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
