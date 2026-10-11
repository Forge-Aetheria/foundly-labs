'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import {
  AlertDialog,
  Badge,
  Button,
  Card,
  Checkbox,
  Modal,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@foundly/ui';
import type { Resource, Service } from '../../../shared/types/appointments';
import {
  GLASS_CARD_SX,
  PRIMARY_BUTTON_SX,
  SECONDARY_BUTTON_SX,
} from '../../../shared/utils/landingCanon';
import { createStaff, removeStaff, setStaffActive, updateStaff } from '../utils/actions';

interface StaffManagerProps {
  staff: Resource[];
  /** Tenant catalog used for the services multi-select and the card badges. */
  services: Service[];
}

interface StaffDraft {
  id?: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  active: boolean;
  serviceIds: string[];
}

const EMPTY_DRAFT: StaffDraft = {
  name: '',
  role: '',
  bio: '',
  avatar: '',
  active: true,
  serviceIds: [],
};

const BIO_MAX = 250;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

function AvatarBadge({ resource }: { resource: Resource }) {
  if (resource.avatar) {
    return (
      <Box
        component="img"
        src={resource.avatar}
        alt=""
        sx={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <Stack
      sx={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'primary.main',
        color: 'background.paper',
      }}
    >
      <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
        {initials(resource.name)}
      </Typography>
    </Stack>
  );
}

/** Equipo y Especialistas: glassmorphism member grid + create/edit modal (005). */
export function StaffManager({ staff, services }: StaffManagerProps) {
  const [members, setMembers] = useState<Resource[]>(staff);
  const [draft, setDraft] = useState<{ open: boolean; editing: boolean; value: StaffDraft }>({
    open: false,
    editing: false,
    value: EMPTY_DRAFT,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  function openCreate() {
    setFieldErrors(null);
    setDraft({ open: true, editing: false, value: EMPTY_DRAFT });
  }

  function openEdit(resource: Resource) {
    setFieldErrors(null);
    setDraft({
      open: true,
      editing: true,
      value: {
        id: resource.id,
        name: resource.name,
        role: resource.role ?? '',
        bio: resource.bio ?? '',
        avatar: resource.avatar ?? '',
        active: resource.active,
        serviceIds: resource.serviceIds ?? [],
      },
    });
  }

  function close() {
    setDraft((prev) => ({ ...prev, open: false }));
  }

  function patch(patchValue: Partial<StaffDraft>) {
    setDraft((prev) => ({ ...prev, value: { ...prev.value, ...patchValue } }));
  }

  function toggleService(serviceId: string, checked: boolean) {
    setDraft((prev) => {
      const current = prev.value.serviceIds;
      return {
        ...prev,
        value: {
          ...prev.value,
          serviceIds: checked ? [...current, serviceId] : current.filter((id) => id !== serviceId),
        },
      };
    });
  }

  function validate(value: StaffDraft): boolean {
    const errors: Record<string, string> = {};
    if (!value.name.trim()) errors.name = 'El nombre es obligatorio.';
    if (!value.role.trim()) errors.role = 'El cargo es obligatorio.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function save() {
    if (!draft.editing && !validate(draft.value)) return;
    if (draft.editing && !validate(draft.value)) return;
    const input = {
      name: draft.value.name,
      role: draft.value.role,
      bio: draft.value.bio,
      avatar: draft.value.avatar,
      active: draft.value.active,
      serviceIds: draft.value.serviceIds,
    };
    const result = draft.editing
      ? updateStaff({ id: draft.value.id, ...input })
      : createStaff(input);
    if (!result.ok) {
      setFieldErrors(result.error.fields ?? { _: result.error.message });
      return;
    }
    setFieldErrors(null);
    if (draft.editing) {
      setMembers((prev) => prev.map((item) => (item.id === result.data.id ? result.data : item)));
    } else {
      setMembers((prev) => [...prev, result.data]);
    }
    close();
  }

  function toggleActive(resource: Resource) {
    const result = setStaffActive({ id: resource.id, active: !resource.active });
    if (result.ok) {
      setMembers((prev) => prev.map((item) => (item.id === result.data.id ? result.data : item)));
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const result = removeStaff({ id: deleteTarget.id });
    if (result.ok) {
      setMembers((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  function serviceName(serviceId: string): string {
    return services.find((service) => service.id === serviceId)?.name ?? '—';
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack spacing={0.25}>
          <Typography variant="h5" component="h1">
            Equipo y Especialistas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Profesionales del negocio: su perfil público, especialidades y servicios.
          </Typography>
        </Stack>
        <Button variant="primary" sx={PRIMARY_BUTTON_SX} onClick={openCreate}>
          + Añadir Profesional
        </Button>
      </Stack>

      {members.length > 0 ? (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
          {members.map((member) => (
            <Card
              key={member.id}
              sx={[
                GLASS_CARD_SX,
                {
                  flex: {
                    xs: '1 1 100%',
                    sm: '1 1 calc(50% - 8px)',
                    md: '1 1 calc(33.333% - 12px)',
                  },
                },
              ]}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <AvatarBadge resource={member} />
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {member.name}
                    </Typography>
                    {member.role ? (
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>

                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                  {(member.serviceIds ?? []).map((serviceId) => (
                    <Badge key={serviceId} pill status="neutral">
                      {serviceName(serviceId)}
                    </Badge>
                  ))}
                  {(member.serviceIds?.length ?? 0) === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      Sin servicios asignados
                    </Typography>
                  ) : null}
                  <Badge pill status={member.active ? 'positive' : 'neutral'}>
                    {member.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </Stack>

                {member.bio ? (
                  <Typography variant="body2" color="text.secondary">
                    {member.bio}
                  </Typography>
                ) : null}

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {member.active ? (
                    <Button
                      variant="secondary"
                      sx={SECONDARY_BUTTON_SX}
                      onClick={() => toggleActive(member)}
                    >
                      Desactivar
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      sx={SECONDARY_BUTTON_SX}
                      onClick={() => toggleActive(member)}
                    >
                      Activar
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    sx={SECONDARY_BUTTON_SX}
                    onClick={() => openEdit(member)}
                  >
                    Editar
                  </Button>
                  <Button variant="destructive" onClick={() => setDeleteTarget(member)}>
                    Eliminar
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card sx={GLASS_CARD_SX}>
          <Typography variant="body2" color="text.secondary">
            No hay profesionales en el equipo. Añade el primero con «+ Añadir Profesional».
          </Typography>
        </Card>
      )}

      {draft.open ? (
        <Modal
          open
          onClose={close}
          title={draft.editing ? `Editar · ${draft.value.name}` : 'Añadir profesional'}
        >
          <Stack spacing={1.5} sx={{ pt: 1, minWidth: { xs: 0, sm: 460 } }}>
            <TextField
              label="Nombre completo"
              value={draft.value.name}
              onChange={(value) => patch({ name: value })}
              error={Boolean(fieldErrors?.name)}
              helperText={fieldErrors?.name}
              required
              fullWidth
            />
            <TextField
              label="Cargo / Título profesional"
              placeholder="P. ej. Peluquera Senior"
              value={draft.value.role}
              onChange={(value) => patch({ role: value })}
              error={Boolean(fieldErrors?.role)}
              helperText={fieldErrors?.role}
              required
              fullWidth
            />
            <TextField
              label="Biografía corta"
              value={draft.value.bio}
              onChange={(value) => patch({ bio: value })}
              multiline
              rows={3}
              maxLength={BIO_MAX}
              helperText={`${draft.value.bio.length}/${BIO_MAX} caracteres`}
              fullWidth
            />

            <TextField
              label="Foto / Avatar (URL)"
              placeholder="https://…"
              value={draft.value.avatar}
              onChange={(value) => patch({ avatar: value })}
              fullWidth
            />
            {draft.value.avatar.trim() ? (
              <Box
                component="img"
                src={draft.value.avatar.trim()}
                alt="Vista previa del avatar"
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            ) : null}

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
                      checked={draft.value.serviceIds.includes(service.id)}
                      onChange={(checked) => toggleService(service.id, checked)}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No hay servicios en el catálogo. Añádelos desde «Servicios».
                </Typography>
              )}
              {draft.value.serviceIds.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                  Advertencia: este profesional no tiene ningún servicio asignado.
                </Typography>
              ) : null}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={draft.value.active}
                onChange={(checked) => patch({ active: checked })}
                label="Activo (visible en la vista pública)"
              />
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button variant="secondary" onClick={close}>
                Cancelar
              </Button>
              <Button variant="primary" sx={PRIMARY_BUTTON_SX} onClick={save}>
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
      ) : null}

      {deleteTarget ? (
        <AlertDialog
          open
          title="Eliminar profesional"
          description={`¿Eliminar a ${deleteTarget.name} del equipo? Dejará de aparecer en la vista pública del negocio.`}
          confirmLabel="Sí, eliminar"
          cancelLabel="Cancelar"
          tone="destructive"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </Stack>
  );
}
