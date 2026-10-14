'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  Badge,
  Button,
  Card,
  Chip,
  DataTable,
  Modal,
  Stack,
  Switch,
  TextField,
  Typography,
  type DataTableColumn,
} from '@foundly/ui';
import { formatPrice } from '../../../shared/utils/format';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import type { Rate, Service } from '../../../shared/types/appointments';
import { useCreateService, useDeleteService, useUpdateService } from '../hooks';

export interface ServiceCatalogProps {
  services: Service[];
  rates: Rate[];
  /** Backend error surfaced to the user (FR-010) when the API is unreachable. */
  error?: string | null;
}

type Feedback = { kind: 'create' } | { kind: 'edit'; service: Service } | null;

interface Draft {
  name: string;
  duration: string;
  price: string;
  category: string;
  description: string;
  requiresAdvance: boolean;
  advanceKind: 'fixed' | 'percent' | '';
  advanceValue: string;
}

const EMPTY_DRAFT: Draft = {
  name: '',
  duration: '',
  price: '',
  category: '',
  description: '',
  requiresAdvance: false,
  advanceKind: '',
  advanceValue: '',
};

function draftFrom(service: Service, rate?: Rate): Draft {
  return {
    name: service.name,
    duration: String(service.durationMinutes),
    price: rate ? String(rate.amountCents / 100) : '',
    category: service.category ?? '',
    description: service.description ?? '',
    requiresAdvance: service.requiresAdvance,
    advanceKind: service.advanceKind ?? '',
    advanceValue:
      service.advanceValue != null
        ? service.advanceKind === 'percent'
          ? String(service.advanceValue)
          : String(service.advanceValue / 100)
        : '',
  };
}

/** Services view: searchable catalog with real create/edit/delete (feature 016, US5). */
export function ServiceCatalog({ services, rates, error }: ServiceCatalogProps) {
  const router = useRouter();
  const toast = useToast();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const removeService = useDeleteService();
  const { pending: saving, run } = useAsyncAction();
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? services.filter((service) => service.name.toLowerCase().includes(needle))
      : services;
  }, [services, query]);

  function openCreate() {
    setFieldErrors(null);
    setActionNotice(null);
    setDraft(EMPTY_DRAFT);
    setFeedback({ kind: 'create' });
  }

  function openEdit(service: Service) {
    setFieldErrors(null);
    setActionNotice(null);
    setDraft(draftFrom(service, rates.find((item) => item.serviceId === service.id)));
    setFeedback({ kind: 'edit', service });
  }

  function patch(value: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...value }));
  }

  async function save() {
    setFieldErrors(null);
    setActionNotice(null);
    const payload = {
      name: draft.name,
      description: draft.description,
      durationMinutes: Number(draft.duration),
      priceCents: Math.round(Number(draft.price) * 100),
      category: draft.category,
      requiresAdvance: draft.requiresAdvance,
      advanceKind: draft.requiresAdvance ? draft.advanceKind || null : null,
      advanceValue: draft.requiresAdvance
        ? draft.advanceKind === 'fixed'
          ? Math.round(Number(draft.advanceValue) * 100)
          : Number(draft.advanceValue)
        : null,
    };
    const result =
      feedback?.kind === 'edit'
        ? await run(() => updateService({ id: feedback.service.id, ...payload }))
        : await run(() => createService(payload));
    if (!result) return;
    if (!result.ok) {
      if (result.error.fields) {
        setFieldErrors(result.error.fields);
      } else {
        setActionNotice(result.error.message);
      }
      return;
    }
    toast.success(feedback?.kind === 'edit' ? 'Servicio actualizado.' : 'Servicio creado.');
    setFeedback(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setActionNotice(null);
    const result = await run(() => removeService({ id: target.id }));
    setDeleteTarget(null);
    if (!result) return;
    if (!result.ok) {
      setActionNotice(result.error.message);
      return;
    }
    toast.success('Servicio eliminado.');
    router.refresh();
  }

  const columns: DataTableColumn<Service>[] = [
    {
      key: 'name',
      header: 'Servicio',
      render: (service) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {service.name}
          </Typography>
          {service.description ? (
            <Typography variant="caption" color="text.secondary">
              {service.description}
            </Typography>
          ) : null}
        </Stack>
      ),
    },
    {
      key: 'duration',
      header: 'Duración',
      render: (service) => `${service.durationMinutes} min`,
    },
    {
      key: 'price',
      header: 'Tarifa',
      render: (service) => {
        const rate = rates.find((item) => item.serviceId === service.id);
        return (
          <Badge pill status="neutral">
            {formatPrice(rate?.amountCents ?? 0, rate?.currency ?? 'EUR')}
          </Badge>
        );
      },
    },
    {
      key: 'advance',
      header: 'Adelanto',
      render: (service) => {
        if (!service.requiresAdvance || service.advanceValue == null) {
          return (
            <Typography variant="caption" color="text.secondary">
              —
            </Typography>
          );
        }
        const rate = rates.find((item) => item.serviceId === service.id);
        const label =
          service.advanceKind === 'percent'
            ? `${service.advanceValue}%`
            : formatPrice(service.advanceValue, rate?.currency ?? 'EUR');
        return (
          <Badge pill status="info">
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Estado',
      render: (service) => (
        <Badge pill status={service.active ? 'positive' : 'neutral'}>
          {service.active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (service) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="secondary" onClick={() => openEdit(service)}>
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteTarget(service)}>
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
                Servicios y tarifas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Catálogo de servicios, duraciones y tarifas del negocio.
              </Typography>
            </Stack>
            <Button variant="primary" onClick={openCreate}>
              + Crear servicio
            </Button>
          </Stack>
          <TextField
            label="Buscar servicio"
            placeholder="Filtrar por nombre…"
            fullWidth
            value={query}
            onChange={setQuery}
          />
        </Stack>
      }
    >
      <ApiErrorDialog title="No se pudieron cargar los servicios" message={error} />
      <ApiErrorDialog title="No se pudo completar la acción" message={actionNotice} />
      <DataTable
        columns={columns}
        rows={visible}
        dense
        emptyMessage={
          query.trim()
            ? 'No hay servicios que coincidan con la búsqueda.'
            : 'No hay servicios en el catálogo.'
        }
        getRowKey={(service) => service.id}
      />

      {feedback ? (
        <Modal
          open
          onClose={() => setFeedback(null)}
          title={feedback.kind === 'create' ? 'Crear servicio' : `Editar · ${feedback.service.name}`}
        >
          <Stack spacing={2} sx={{ pt: 1, minWidth: { xs: 0, sm: 460 } }}>
            <TextField
              label="Nombre"
              value={draft.name}
              onChange={(value) => patch({ name: value })}
              error={Boolean(fieldErrors?.name)}
              helperText={fieldErrors?.name}
              required
              fullWidth
            />
            <TextField
              label="Duración (min)"
              type="number"
              value={draft.duration}
              onChange={(value) => patch({ duration: value })}
              error={Boolean(fieldErrors?.durationMinutes)}
              helperText={fieldErrors?.durationMinutes}
              required
              fullWidth
            />
            <TextField
              label="Precio (€)"
              type="number"
              value={draft.price}
              onChange={(value) => patch({ price: value })}
              error={Boolean(fieldErrors?.priceCents)}
              helperText={fieldErrors?.priceCents}
              required
              fullWidth
            />
            <TextField
              label="Categoría (opcional)"
              value={draft.category}
              onChange={(value) => patch({ category: value })}
              error={Boolean(fieldErrors?.category)}
              helperText={fieldErrors?.category}
              maxLength={60}
              fullWidth
            />
            <TextField
              label="Descripción (opcional)"
              value={draft.description}
              onChange={(value) => patch({ description: value })}
              error={Boolean(fieldErrors?.description)}
              helperText={fieldErrors?.description}
              multiline
              rows={3}
              maxLength={2000}
              fullWidth
            />
            <Switch
              checked={draft.requiresAdvance}
              onChange={(checked) =>
                patch({
                  requiresAdvance: checked,
                  ...(checked ? {} : { advanceKind: '', advanceValue: '' }),
                })
              }
              label="Requiere adelanto"
            />
            {draft.requiresAdvance ? (
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
                    selected={draft.advanceKind === 'fixed'}
                    onClick={() => patch({ advanceKind: 'fixed' })}
                  />
                  <Chip
                    label="Porcentaje"
                    selectable
                    selected={draft.advanceKind === 'percent'}
                    onClick={() => patch({ advanceKind: 'percent' })}
                  />
                </Stack>
                <TextField
                  label={draft.advanceKind === 'percent' ? 'Porcentaje (%)' : 'Importe (€)'}
                  type="number"
                  value={draft.advanceValue}
                  onChange={(value) => patch({ advanceValue: value })}
                  error={Boolean(fieldErrors?.advanceKind ?? fieldErrors?.advanceValue)}
                  helperText={fieldErrors?.advanceKind ?? fieldErrors?.advanceValue}
                  fullWidth
                />
              </Stack>
            ) : null}
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
              <Button variant="secondary" onClick={() => setFeedback(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={save} loading={saving}>
                Guardar
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <AlertDialog
          open
          title="Eliminar servicio"
          description={`¿Eliminar "${deleteTarget.name}"? Dejará de ofrecerse en la reserva pública.`}
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
