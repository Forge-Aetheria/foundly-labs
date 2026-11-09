import { Button, Chip, Modal, Stack, Switch, TextField } from '@foundly/ui';

export interface ServiceDraft {
  name: string;
  duration: string;
  price: string;
  category: string;
  description: string;
  requiresAdvance: boolean;
  advanceKind: 'fixed' | 'percent' | '';
  advanceValue: string;
}

export interface ServiceDialogProps {
  open: boolean;
  title: string;
  value: ServiceDraft;
  fieldErrors: Record<string, string> | null;
  saving: boolean;
  onClose: () => void;
  onPatch: (value: Partial<ServiceDraft>) => void;
  onSave: () => void;
}

/** Create/edit service modal (feature 016, US5). */
export function ServiceDialog({
  open,
  title,
  value,
  fieldErrors,
  saving,
  onClose,
  onPatch,
  onSave,
}: ServiceDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <Stack spacing={2} sx={{ pt: 1, minWidth: { xs: 0, sm: 460 } }}>
        <TextField
          label="Nombre"
          value={value.name}
          onChange={(name) => onPatch({ name })}
          error={Boolean(fieldErrors?.name)}
          helperText={fieldErrors?.name}
          required
          fullWidth
        />
        <TextField
          label="Duración (min)"
          type="number"
          value={value.duration}
          onChange={(duration) => onPatch({ duration })}
          error={Boolean(fieldErrors?.durationMinutes)}
          helperText={fieldErrors?.durationMinutes}
          required
          fullWidth
        />
        <TextField
          label="Precio (€)"
          type="number"
          value={value.price}
          onChange={(price) => onPatch({ price })}
          error={Boolean(fieldErrors?.priceCents)}
          helperText={fieldErrors?.priceCents}
          required
          fullWidth
        />
        <TextField
          label="Categoría (opcional)"
          value={value.category}
          onChange={(category) => onPatch({ category })}
          error={Boolean(fieldErrors?.category)}
          helperText={fieldErrors?.category}
          maxLength={60}
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
        <Switch
          checked={value.requiresAdvance}
          onChange={(checked) =>
            onPatch({
              requiresAdvance: checked,
              ...(checked ? {} : { advanceKind: '', advanceValue: '' }),
            })
          }
          label="Requiere adelanto"
        />
        {value.requiresAdvance ? (
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: 'wrap' }}
              aria-label="Tipo de adelanto"
            >
              <Chip
                label="Importe fijo"
                selectable
                selected={value.advanceKind === 'fixed'}
                onClick={() => onPatch({ advanceKind: 'fixed' })}
              />
              <Chip
                label="Porcentaje"
                selectable
                selected={value.advanceKind === 'percent'}
                onClick={() => onPatch({ advanceKind: 'percent' })}
              />
            </Stack>
            <TextField
              label={value.advanceKind === 'percent' ? 'Porcentaje (%)' : 'Importe (€)'}
              type="number"
              value={value.advanceValue}
              onChange={(advanceValue) => onPatch({ advanceValue })}
              error={Boolean(fieldErrors?.advanceKind ?? fieldErrors?.advanceValue)}
              helperText={fieldErrors?.advanceKind ?? fieldErrors?.advanceValue}
              fullWidth
            />
          </Stack>
        ) : null}
        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSave} loading={saving}>
            Guardar
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
