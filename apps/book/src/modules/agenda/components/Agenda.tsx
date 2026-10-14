'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  Chip,
  DataTable,
  Modal,
  Stack,
  TextField,
  Typography,
  type BadgeStatus,
  type DataTableColumn,
} from '@foundly/ui';
import type { Appointment, Resource, Service } from '../../../shared/types/appointments';
import { useCreateAppointment } from '../hooks';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';

export interface AgendaRow {
  id: string;
  startAt: string;
  endAt: string;
  clientName: string;
  clientContact: string | null;
  serviceName: string;
  durationMinutes: number;
  resourceName: string;
  status: string;
}

export interface AgendaProps {
  appointments: AgendaRow[];
  /** Tenant catalog (real services) for the create flow. */
  services?: Service[];
  /** Tenant professionals (real specialists) for the create flow. */
  resources?: Resource[];
  /** Backend/load error surfaced to the user (FR-010). */
  error?: string | null;
}

const STATUS_BADGE: Record<string, BadgeStatus> = {
  pending: 'warning',
  confirmed: 'positive',
  'checked-in': 'info',
  completed: 'info',
  cancelled: 'neutral',
  'no-show': 'neutral',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  'checked-in': 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  'no-show': 'No asistió',
};

const STATUS_FILTERS = [
  { key: 'all', label: 'Todas', match: () => true },
  { key: 'pending', label: 'Pendientes', match: (status: string) => status === 'pending' },
  { key: 'confirmed', label: 'Confirmadas', match: (status: string) => status === 'confirmed' },
  { key: 'completed', label: 'Completadas', match: (status: string) => status === 'completed' },
  { key: 'cancelled', label: 'Canceladas', match: (status: string) => status === 'cancelled' },
] as const;

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type ModalState = { kind: 'create' } | { kind: 'detail'; row: AgendaRow } | null;

/** Agenda view: header + day/status filters + appointments table (Clean Light UI). */
export function Agenda({ appointments, services = [], resources = [], error }: AgendaProps) {
  const router = useRouter();
  const toast = useToast();
  const createAppointment = useCreateAppointment();
  const { pending: saving, run } = useAsyncAction();
  const [rows, setRows] = useState<AgendaRow[]>(appointments);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modal, setModal] = useState<ModalState>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceId: '',
    specialistId: '',
    date: '',
    time: '09:00',
  });

  useEffect(() => {
    setSelectedDate(dateKey(new Date()));
    setMounted(true);
  }, []);

  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + index);
      return dateKey(day);
    });
  }, []);

  const visible = useMemo(() => {
    const statusRule = STATUS_FILTERS.find((filter) => filter.key === statusFilter);
    return rows.filter(
      (row) =>
        selectedDate !== null &&
        dayKey(row.startAt) === selectedDate &&
        (statusRule?.match(row.status) ?? true),
    );
  }, [rows, selectedDate, statusFilter]);

  function openCreate() {
    setCreateError(null);
    setForm((prev) => ({ ...prev, date: selectedDate ?? '' }));
    setModal({ kind: 'create' });
  }

  async function saveCreate() {
    setCreateError(null);
    if (!form.serviceId || !form.specialistId) {
      setCreateError('Selecciona un servicio y un profesional reales.');
      return;
    }
    const start = new Date(`${form.date}T${form.time}:00`);
    if (!form.date || Number.isNaN(start.getTime())) {
      setCreateError('Selecciona una fecha y una hora válidas.');
      return;
    }
    const result = await run(() =>
      createAppointment({
        resourceId: form.specialistId,
        serviceId: form.serviceId,
        clientName: form.clientName,
        clientContact:
          form.clientEmail || form.clientPhone
            ? `${form.clientEmail} · ${form.clientPhone}`
            : undefined,
        startAt: start.toISOString(),
      }),
    );
    if (!result) return;
    if (!result.ok) {
      setCreateError(result.error.message);
      return;
    }
    const created: Appointment = result.data;
    const service = services.find((item) => item.id === created.serviceId);
    const resource = resources.find((item) => item.id === created.resourceId);
    const newRow: AgendaRow = {
      id: created.id,
      startAt: created.startAt,
      endAt: created.endAt,
      clientName: created.clientName,
      clientContact: created.clientContact,
      serviceName: service?.name ?? '—',
      durationMinutes: created.appliedDurationMinutes,
      resourceName: resource?.name ?? '—',
      status: created.status,
    };
    setRows((prev) => [newRow, ...prev]);
    setForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      serviceId: '',
      specialistId: '',
      date: '',
      time: '09:00',
    });
    setModal(null);
    toast.success('Cita creada.');
    router.refresh();
  }

  const columns: DataTableColumn<AgendaRow>[] = [
    {
      key: 'time',
      header: 'Hora',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatTime(row.startAt)}
        </Typography>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.clientName}
          </Typography>
          {row.clientContact ? (
            <Typography variant="caption" color="text.secondary">
              {row.clientContact}
            </Typography>
          ) : null}
        </Stack>
      ),
    },
    {
      key: 'service',
      header: 'Servicio',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{row.serviceName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.durationMinutes} min
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'resource',
      header: 'Profesional',
      render: (row) => <Typography variant="body2">{row.resourceName}</Typography>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <Badge pill status={STATUS_BADGE[row.status] ?? 'neutral'}>
          {STATUS_LABEL[row.status] ?? row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <Button variant="secondary" onClick={() => setModal({ kind: 'detail', row })}>
          Detalles
        </Button>
      ),
    },
  ];

  return (
    <Card
      header={
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography variant="h5" component="h1">
              Agenda de citas
            </Typography>
            <Button variant="primary" onClick={openCreate}>
              + Nueva cita
            </Button>
          </Stack>

          {mounted && selectedDate ? (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {days.map((day, index) => (
                  <Button
                    key={day}
                    variant={selectedDate === day ? 'primary' : 'secondary'}
                    onClick={() => setSelectedDate(day)}
                  >
                    {index === 0 ? 'Hoy' : day}
                  </Button>
                ))}
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {STATUS_FILTERS.map((filter) => (
                  <Button
                    key={filter.key}
                    variant={statusFilter === filter.key ? 'primary' : 'secondary'}
                    onClick={() => setStatusFilter(filter.key)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      }
    >
      <ApiErrorDialog title="No se pudo cargar la agenda" message={error} />
      {mounted && selectedDate ? (
        <DataTable
          columns={columns}
          rows={visible}
          dense
          emptyMessage="No hay citas en este periodo."
          getRowKey={(row) => row.id}
        />
      ) : null}

      {modal?.kind === 'create' ? (
        <Modal open onClose={() => setModal(null)} title="Nueva cita">
          <Stack spacing={2}>
            <TextField
              label="Cliente"
              value={form.clientName}
              onChange={(value) => setForm((prev) => ({ ...prev, clientName: value }))}
            />
            <TextField
              label="Email"
              type="email"
              value={form.clientEmail}
              onChange={(value) => setForm((prev) => ({ ...prev, clientEmail: value }))}
            />
            <TextField
              label="Teléfono"
              value={form.clientPhone}
              onChange={(value) => setForm((prev) => ({ ...prev, clientPhone: value }))}
            />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Servicio
            </Typography>
            {services.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {services.map((service) => (
                  <Chip
                    key={service.id}
                    label={service.name}
                    selectable
                    selected={form.serviceId === service.id}
                    onClick={() => setForm((prev) => ({ ...prev, serviceId: service.id }))}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No hay servicios disponibles.
              </Typography>
            )}
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Profesional
            </Typography>
            {resources.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {resources.map((resource) => (
                  <Chip
                    key={resource.id}
                    label={resource.name}
                    selectable
                    selected={form.specialistId === resource.id}
                    onClick={() => setForm((prev) => ({ ...prev, specialistId: resource.id }))}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No hay profesionales disponibles.
              </Typography>
            )}
            <TextField
              label="Fecha"
              type="date"
              value={form.date}
              onChange={(value) => setForm((prev) => ({ ...prev, date: value }))}
            />
            <TextField
              label="Hora"
              type="time"
              value={form.time}
              onChange={(value) => setForm((prev) => ({ ...prev, time: value }))}
            />
            {createError ? (
              <Typography variant="body2" color="error" role="alert">
                {createError}
              </Typography>
            ) : null}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={saveCreate} loading={saving}>
                Guardar
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}

      {modal?.kind === 'detail' ? (
        <Modal open onClose={() => setModal(null)} title={`Detalle · ${modal.row.clientName}`}>
          <Stack spacing={1}>
            <Typography variant="body2">
              Cliente: <strong>{modal.row.clientName}</strong>
            </Typography>
            {modal.row.clientContact ? (
              <Typography variant="body2" color="text.secondary">
                Contacto: {modal.row.clientContact}
              </Typography>
            ) : null}
            <Typography variant="body2">
              Fecha y hora: {dayKey(modal.row.startAt)} · {formatTime(modal.row.startAt)}
            </Typography>
            <Typography variant="body2">Servicio: {modal.row.serviceName}</Typography>
            <Typography variant="body2">Profesional: {modal.row.resourceName}</Typography>
            <Badge pill status={STATUS_BADGE[modal.row.status] ?? 'neutral'}>
              {STATUS_LABEL[modal.row.status] ?? modal.row.status}
            </Badge>
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="primary" onClick={() => setModal(null)}>
                Cerrar
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}
    </Card>
  );
}
