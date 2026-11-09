import { Button, Checkbox, Modal, Stack, Switch, TextField, Typography } from '@foundly/ui';
import type { Service } from '../../../../shared/types/appointments';
import { PRIMARY_BUTTON_SX } from '../../../../shared/utils/landingCanon';
import { ImageUploadField } from '../../../../shared/components/ImageUploadField';
import type { ActionResult } from '../../../../shared/types/result';

export const STAFF_BIO_MAX = 250;

export interface StaffDraft {
  id?: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  active: boolean;
  serviceIds: string[];
}

export interface StaffDialogProps {
  open: boolean;
  editing: boolean;
  value: StaffDraft;
  services: Service[];
  fieldErrors: Record<string, string> | null;
  saving: boolean;
  onClose: () => void;
  onPatch: (value: Partial<StaffDraft>) => void;
  onToggleService: (serviceId: string, checked: boolean) => void;
  onSave: () => void;
  onUpload: (file: File) => Promise<ActionResult<{ url: string }>>;
}

/** Create/edit staff member modal (feature 005/021). */
export function StaffDialog({
  open,
  editing,
  value,
  services,
  fieldErrors,
  saving,
  onClose,
  onPatch,
  onToggleService,
  onSave,
  onUpload,
}: StaffDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Editar · ${value.name}` : 'Añadir profesional'}
    >
      <Stack spacing={1.5} sx={{ pt: 1, minWidth: { xs: 0, sm: 460 } }}>
        <TextField
          label="Nombre completo"
          value={value.name}
          onChange={(name) => onPatch({ name })}
          error={Boolean(fieldErrors?.name)}
          helperText={fieldErrors?.name}
          required
          fullWidth
        />
        <TextField
          label="Cargo / Título profesional"
          placeholder="P. ej. Peluquera Senior"
          value={value.role}
          onChange={(role) => onPatch({ role })}
          error={Boolean(fieldErrors?.role)}
          helperText={fieldErrors?.role}
          required
          fullWidth
        />
        <TextField
          label="Biografía corta"
          value={value.bio}
          onChange={(bio) => onPatch({ bio })}
          multiline
          rows={3}
          maxLength={STAFF_BIO_MAX}
          helperText={`${value.bio.length}/${STAFF_BIO_MAX} caracteres`}
          fullWidth
        />

        <ImageUploadField
          label="Foto / Avatar"
          preview="circle"
          value={value.avatar}
          onChange={(avatar) => onPatch({ avatar })}
          onUpload={onUpload}
          helperText="Recomendado: cuadrada (1:1)."
        />

        <Stack spacing={1}>
          <Typography variant="h6" component="h3">
            Servicios que presta
          </Typography>
          {services.length > 0 ? (
            <Stack spacing={0.5}>
              {services.map((service) => (
                <Checkbox
                  key={service.id}
                  label={service.name}
                  checked={value.serviceIds.includes(service.id)}
                  onChange={(checked) => onToggleService(service.id, checked)}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No hay servicios en el catálogo. Añádelos desde «Servicios».
            </Typography>
          )}
          {value.serviceIds.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
              Advertencia: este profesional no tiene ningún servicio asignado.
            </Typography>
          ) : null}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={value.active}
            onChange={(active) => onPatch({ active })}
            label="Activo (visible en la vista pública)"
          />
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" sx={PRIMARY_BUTTON_SX} onClick={onSave} loading={saving}>
            Guardar profesional
          </Button>
        </Stack>
        {fieldErrors?._ ? (
          <Typography variant="body2" color="error">
            {fieldErrors._}
          </Typography>
        ) : null}
      </Stack>
    </Modal>
  );
}
