'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/shared/compat/useAppRouter';
import {
  Badge,
  Button,
  Card,
  DataTable,
  Stack,
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
import { ServiceDialog, type ServiceDraft } from './dialogs/ServiceDialog';
import { DeleteServiceDialog } from './dialogs/DeleteServiceDialog';

export interface ServiceCatalogProps {
  services: Service[];
  rates: Rate[];
  /** Backend error surfaced to the user (FR-010) when the API is unreachable. */
  error?: string | null;
}

type Feedback = { kind: 'create' } | { kind: 'edit'; service: Service } | null;

const EMPTY_DRAFT: ServiceDraft = {
  name: '',
  duration: '',
  price: '',
  category: '',
  description: '',
  requiresAdvance: false,
  advanceKind: '',
  advanceValue: '',
};

function draftFrom(service: Service, rate?: Rate): ServiceDraft {
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
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_DRAFT);
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
    setDraft(
      draftFrom(
        service,
        rates.find((item) => item.serviceId === service.id),
      ),
    );
    setFeedback({ kind: 'edit', service });
  }

  function patch(value: Partial<ServiceDraft>) {
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

      <ServiceDialog
        open={Boolean(feedback)}
        title={feedback?.kind === 'edit' ? `Editar · ${feedback.service.name}` : 'Crear servicio'}
        value={draft}
        fieldErrors={fieldErrors}
        saving={saving}
        onClose={() => setFeedback(null)}
        onPatch={patch}
        onSave={save}
      />

      <DeleteServiceDialog
        open={Boolean(deleteTarget)}
        description={
          deleteTarget
            ? `¿Eliminar "${deleteTarget.name}"? Dejará de ofrecerse en la reserva pública.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
