import { Button, Chip, Modal, Stack, Switch, TextField, Typography } from '@foundly/ui';
import {
  PAYMENT_DETAIL_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_FIELDS,
  type PaymentMethodDetails,
  type PaymentMethodType,
} from '../../../../shared/types/payments';

export interface PaymentMethodDraft {
  type: PaymentMethodType;
  title: string;
  details: PaymentMethodDetails;
  instructions: string;
  active: boolean;
}

export interface PaymentMethodDialogProps {
  open: boolean;
  editing: boolean;
  value: PaymentMethodDraft;
  availableTypes: PaymentMethodType[];
  fieldErrors: Record<string, string> | null;
  pending: boolean;
  onClose: () => void;
  onPatch: (value: Partial<PaymentMethodDraft>) => void;
  onPatchDetail: (key: keyof PaymentMethodDetails, value: string) => void;
  onSubmit: () => void;
}

/** Create/edit payment method modal (feature 017/022). */
export function PaymentMethodDialog({
  open,
  editing,
  value,
  availableTypes,
  fieldErrors,
  pending,
  onClose,
  onPatch,
  onPatchDetail,
  onSubmit,
}: PaymentMethodDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar método de pago' : 'Nuevo Método de Pago'}
    >
      <Stack spacing={2} sx={{ pt: 1, minWidth: { xs: 0, sm: 460 } }}>
        <Stack spacing={1}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Tipo de pago
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {availableTypes.map((type) => (
              <Chip
                key={type}
                label={PAYMENT_METHOD_LABELS[type]}
                selectable
                selected={value.type === type}
                onClick={() => onPatch({ type, details: {} })}
              />
            ))}
          </Stack>
        </Stack>

        <TextField
          label="Título"
          placeholder="P. ej. Pago Móvil Banesco"
          value={value.title}
          onChange={(title) => onPatch({ title })}
          error={Boolean(fieldErrors?.title)}
          helperText={fieldErrors?.title}
          fullWidth
        />

        {PAYMENT_TYPE_FIELDS[value.type].map((key) => (
          <TextField
            key={key}
            label={PAYMENT_DETAIL_LABELS[key]}
            value={value.details[key] ?? ''}
            onChange={(detail) => onPatchDetail(key, detail)}
            error={Boolean(fieldErrors?.[`details.${key}`])}
            helperText={fieldErrors?.[`details.${key}`]}
            fullWidth
          />
        ))}

        <TextField
          label="Instrucciones (opcional)"
          value={value.instructions}
          onChange={(instructions) => onPatch({ instructions })}
          multiline
          rows={2}
          maxLength={2000}
          fullWidth
        />

        <Switch
          checked={value.active}
          onChange={(active) => onPatch({ active })}
          label={value.active ? 'Activo' : 'Inactivo'}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSubmit} loading={pending}>
            Guardar método
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
