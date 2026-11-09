'use client';

import { useState } from 'react';
import { useRouter } from '@/shared/compat/useAppRouter';
import Box from '@mui/material/Box';
import { Badge, Button, Card, Stack, Typography } from '@foundly/ui';
import type { Resource, Service } from '../../../shared/types/appointments';
import {
  GLASS_CARD_SX,
  PRIMARY_BUTTON_SX,
  SECONDARY_BUTTON_SX,
} from '../../../shared/utils/landingCanon';
import {
  useCreateStaff,
  useRemoveStaff,
  useSetStaffActive,
  useUpdateStaff,
  useUploadStaffAvatar,
} from '../hooks';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { StaffDialog, type StaffDraft } from './dialogs/StaffDialog';
import { DeleteStaffDialog } from './dialogs/DeleteStaffDialog';

export interface StaffManagerProps {
  staff: Resource[];
  /** Tenant catalog used for the services multi-select and the card badges. */
  services: Service[];
  /** Tenant scope for media uploads (feature 021); uploads disabled when empty. */
  tenantId?: string;
  /** Backend error surfaced to the user (FR-010) when the API is unreachable. */
  error?: string | null;
}

const EMPTY_DRAFT: StaffDraft = {
  name: '',
  role: '',
  bio: '',
  avatar: '',
  active: true,
  serviceIds: [],
};

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
export function StaffManager({ staff, services, tenantId, error }: StaffManagerProps) {
  const [members, setMembers] = useState<Resource[]>(staff);
  const [draft, setDraft] = useState<{ open: boolean; editing: boolean; value: StaffDraft }>({
    open: false,
    editing: false,
    value: EMPTY_DRAFT,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const { pending: saving, run } = useAsyncAction();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const setStaffActive = useSetStaffActive();
  const removeStaff = useRemoveStaff();
  const uploadAvatar = useUploadStaffAvatar(tenantId ?? '');

  /** Transient (network/config) failures surface as a non-destructive banner. */
  function handleActionFailure(result: {
    ok: false;
    error: { code: string; message: string; fields?: Record<string, string> };
  }) {
    if (result.error.code === 'STATE_ERROR' || result.error.code === 'UNAUTHENTICATED') {
      setActionNotice(result.error.message);
      return;
    }
    setActionNotice(null);
    setFieldErrors(result.error.fields ?? { _: result.error.message });
  }

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

  async function save() {
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
    const result = await run(() =>
      draft.editing ? updateStaff({ id: draft.value.id, ...input }) : createStaff(input),
    );
    if (!result) return;
    if (!result.ok) {
      handleActionFailure(result);
      return;
    }
    setActionNotice(null);
    setFieldErrors(null);
    if (draft.editing) {
      setMembers((prev) => prev.map((item) => (item.id === result.data.id ? result.data : item)));
    } else {
      setMembers((prev) => [...prev, result.data]);
    }
    toast.success(draft.editing ? 'Profesional actualizado.' : 'Profesional añadido.');
    close();
    router.refresh();
  }

  async function toggleActive(resource: Resource) {
    const result = await run(() => setStaffActive({ id: resource.id, active: !resource.active }));
    if (!result) return;
    if (result.ok) {
      setActionNotice(null);
      setMembers((prev) => prev.map((item) => (item.id === result.data.id ? result.data : item)));
    } else {
      handleActionFailure(result);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const result = await run(() => removeStaff({ id: target.id }));
    if (result?.ok) {
      setActionNotice(null);
      setMembers((prev) => prev.filter((item) => item.id !== target.id));
      toast.success('Profesional eliminado.');
      router.refresh();
    } else if (result && !result.ok) {
      handleActionFailure(result);
    }
    setDeleteTarget(null);
  }

  function serviceName(serviceId: string): string {
    return services.find((service) => service.id === serviceId)?.name ?? '—';
  }

  return (
    <Stack spacing={3}>
      <ApiErrorDialog title="No se pudo cargar el equipo" message={error} />
      <ApiErrorDialog title="No se pudo completar la acción" message={actionNotice} />
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

      <StaffDialog
        open={draft.open}
        editing={draft.editing}
        value={draft.value}
        services={services}
        fieldErrors={fieldErrors}
        saving={saving}
        onClose={close}
        onPatch={patch}
        onToggleService={toggleService}
        onSave={save}
        onUpload={uploadAvatar}
      />

      <DeleteStaffDialog
        open={Boolean(deleteTarget)}
        description={
          deleteTarget
            ? `¿Eliminar a ${deleteTarget.name} del equipo? Dejará de aparecer en la vista pública del negocio.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Stack>
  );
}
