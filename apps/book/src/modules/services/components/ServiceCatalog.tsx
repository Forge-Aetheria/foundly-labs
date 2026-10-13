'use client';

import { useMemo, useState } from 'react';
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
import { formatPrice } from '../../../shared/utils/format';
import type { Rate, Service } from '../../../shared/types/appointments';

export interface ServiceCatalogProps {
  services: Service[];
  rates: Rate[];
  /** Backend error surfaced to the user (FR-010) when the API is unreachable. */
  error?: string | null;
}

type Feedback = { kind: 'create' } | { kind: 'edit'; service: Service } | null;

/** Services view: searchable catalog with row actions (Clean Light UI). */
export function ServiceCatalog({ services, rates, error }: ServiceCatalogProps) {
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? services.filter((service) => service.name.toLowerCase().includes(needle))
      : services;
  }, [services, query]);

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
          <Button variant="secondary" onClick={() => setFeedback({ kind: 'edit', service })}>
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
            <Button variant="primary" onClick={() => setFeedback({ kind: 'create' })}>
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
      {error ? (
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2" color="error" role="alert">
            {error}
          </Typography>
        </Stack>
      ) : null}
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
          title={
            feedback.kind === 'create' ? 'Crear servicio' : `Editar · ${feedback.service.name}`
          }
        >
          <Typography variant="body2" color="text.secondary">
            El {feedback.kind === 'create' ? 'alta de servicios' : 'editor de servicios'} estará
            disponible en la próxima versión del panel.
          </Typography>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <AlertDialog
          open
          title="Eliminar servicio"
          description={`¿Eliminar "${deleteTarget.name}"? La operación de baja estará disponible en la próxima versión del panel.`}
          confirmLabel="Entendido"
          cancelLabel="Cancelar"
          tone="destructive"
          onConfirm={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </Card>
  );
}
