'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import {
  AlertDialog,
  Badge,
  Button,
  Card,
  DataTable,
  Modal,
  Stack,
  TextField,
  Typography,
  type DataTableColumn,
} from '@foundly/ui';
import type { Resource } from '../../../domain/appointments/types';
import { createStaff, removeStaff, setStaffActive, updateStaff } from '../actions';

interface StaffManagerProps {
  staff: Resource[];
}

interface StaffDraft {
  id?: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

const EMPTY_DRAFT: StaffDraft = { name: '', role: '', avatar: '', bio: '' };

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
        sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <Stack
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'primary.main',
        color: 'background.paper',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {initials(resource.name)}
      </Typography>
    </Stack>
  );
}

/** Equipo view: manage the professionals shown on the public landing (US4 storefront). */
export function StaffManager({ staff }: StaffManagerProps) {
  const [members, setMembers] = useState<Resource[]>(staff);
  const [draft, setDraft] = useState<{ open: boolean; editing: boolean; value: StaffDraft }>({
    open: false,
    editing: false,
    value: EMPTY_DRAFT,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  function openCreate() {
    setFormError(null);
    setDraft({ open: true, editing: false, value: EMPTY_DRAFT });
  }

  function openEdit(resource: Resource) {
    setFormError(null);
    setDraft({
      open: true,
      editing: true,
      value: {
        id: resource.id,
        name: resource.name,
        role: resource.role ?? '',
        avatar: resource.avatar ?? '',
        bio: resource.bio ?? '',
      },
    });
  }

  function close() {
    setDraft((prev) => ({ ...prev, open: false }));
  }

  function patch(patchValue: Partial<StaffDraft>) {
    setDraft((prev) => ({ ...prev, value: { ...prev.value, ...patchValue } }));
  }

  function save() {
    const result = draft.editing
      ? updateStaff({ id: draft.value.id, ...draft.value })
      : createStaff({ ...draft.value, active: true });
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    setFormError(null);
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

  const columns: DataTableColumn<Resource>[] = [
    {
      key: 'name',
      header: 'Profesional',
      render: (resource) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AvatarBadge resource={resource} />
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {resource.name}
            </Typography>
            {resource.role ? (
              <Typography variant="caption" color="text.secondary">
                {resource.role}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      ),
    },
    {
      key: 'bio',
      header: 'Bio',
      render: (resource) =>
        resource.bio ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
            {resource.bio}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Sin descripción
          </Typography>
        ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (resource) => (
        <Badge pill status={resource.active ? 'positive' : 'neutral'}>
          {resource.active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (resource) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {resource.active ? (
            <Button variant="secondary" onClick={() => toggleActive(resource)}>
              Desactivar
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => toggleActive(resource)}>
              Activar
            </Button>
          )}
          <Button variant="secondary" onClick={() => openEdit(resource)}>
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteTarget(resource)}>
            Eliminar
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Card
      header={
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.25}>
              <Typography variant="h5" component="h1">
                Equipo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Profesionales que aparecen en la pestaña «Equipo» de tu mini-sitio.
              </Typography>
            </Stack>
            <Button variant="primary" onClick={openCreate}>
              + Añadir profesional
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Los cambios se reflejan al instante en la vista pública del negocio.
          </Typography>
        </Stack>
      }
    >
      <DataTable
        columns={columns}
        rows={members}
        dense
        emptyMessage="No hay profesionales en el equipo."
        getRowKey={(resource) => resource.id}
      />

      {draft.open ? (
        <Modal
          open
          onClose={close}
          title={draft.editing ? `Editar · ${draft.value.name}` : 'Añadir profesional'}
        >
          <Stack spacing={1.5} sx={{ pt: 1, minWidth: { xs: 0, sm: 420 } }}>
            <TextField
              label="Nombre"
              value={draft.value.name}
              onChange={(value) => patch({ name: value })}
              error={Boolean(formError)}
              required
              fullWidth
            />
            <TextField
              label="Rol / cargo"
              placeholder="P. ej. Peluquera senior"
              value={draft.value.role}
              onChange={(value) => patch({ role: value })}
              fullWidth
            />
            <TextField
              label="Foto (URL)"
              placeholder="https://…"
              value={draft.value.avatar}
              onChange={(value) => patch({ avatar: value })}
              fullWidth
            />
            <TextField
              label="Bio corta"
              value={draft.value.bio}
              onChange={(value) => patch({ bio: value })}
              fullWidth
            />
            {formError ? (
              <Typography variant="body2" color="error">
                {formError}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button variant="secondary" onClick={close}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={save}>
                {draft.editing ? 'Guardar cambios' : 'Añadir'}
              </Button>
            </Stack>
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
    </Card>
  );
}