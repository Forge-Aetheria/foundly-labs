'use client';

import { useState } from 'react';
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
import type { Appointment, Resource, Service } from '../../../shared/types/appointments';
import {
  useCancelAppointment,
  useChangeAppointmentStatus,
  useCreateAppointment,
  useRescheduleAppointment,
} from '../hooks';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { STATUS_BADGE, STATUS_LABEL, dayKey, formatTime } from '../utils/status';
import type { AgendaRow } from '../utils/types';
import { CreateAppointmentDialog } from './dialogs/CreateAppointmentDialog';
import { AppointmentDetailDialog } from './dialogs/AppointmentDetailDialog';
import { RejectAppointmentDialog } from './dialogs/RejectAppointmentDialog';
import { RescheduleAppointmentDialog } from './dialogs/RescheduleAppointmentDialog';

export type { AgendaRow } from '../utils/types';

export interface AgendaProps {
  appointments: AgendaRow[];
  /** Applied date range (server state); edited via `router.push`. */
  range: { from: string; to: string };
  /** Tenant catalog (real services) for the create flow. */
  services?: Service[];
  /** Tenant professionals (real specialists) for the create flow. */
  resources?: Resource[];
  /** Backend/load error surfaced to the user (FR-010). */
  error?: string | null;
}

const STATUS_FILTERS = [
  { key: 'all', label: 'Todas', match: () => true },
  { key: 'pending', label: 'Pendientes', match: (status: string) => status === 'pending' },
  { key: 'confirmed', label: 'Confirmadas', match: (status: string) => status === 'confirmed' },
  { key: 'completed', label: 'Completadas', match: (status: string) => status === 'completed' },
  { key: 'cancelled', label: 'Canceladas', match: (status: string) => status === 'cancelled' },
] as const;

type ModalState =
  | { kind: 'create' }
  | { kind: 'detail'; row: AgendaRow }
  | { kind: 'reschedule'; row: AgendaRow }
  | { kind: 'reject'; row: AgendaRow }
  | null;

/** Agenda view: range filter + appointments table + lifecycle controls (Clean Light UI). */
export function Agenda({ appointments, range, services = [], resources = [], error }: AgendaProps) {
  const router = useRouter();
  const toast = useToast();
  const createAppointment = useCreateAppointment();
  const changeStatus = useChangeAppointmentStatus();
  const cancelAppointment = useCancelAppointment();
  const rescheduleAppointment = useRescheduleAppointment();
  const { pending: saving, run } = useAsyncAction();
  const [rows, setRows] = useState<AgendaRow[]>(appointments);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modal, setModal] = useState<ModalState>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('No disponible');
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '09:00' });
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceId: '',
    specialistId: '',
    date: '',
    time: '09:00',
  });

  const visible = rows.filter((row) => {
    const statusRule = STATUS_FILTERS.find((filter) => filter.key === statusFilter);
    return statusRule?.match(row.status) ?? true;
  });

  function updateRow(updated: Appointment) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === updated.id
          ? {
              ...row,
              startAt: updated.startAt,
              endAt: updated.endAt,
              status: updated.status,
              payment: updated.payment,
              notifications: updated.notifications,
            }
          : row,
      ),
    );
  }

  function applyRange() {
    const nextTo = to < from ? from : to;
    setTo(nextTo);
    router.push(`/admin/agenda?from=${from}&to=${nextTo}`);
  }

  async function accept(row: AgendaRow) {
    setActionError(null);
    const result = await run(() => changeStatus({ appointmentId: row.id, status: 'confirmed' }));
    if (!result) return;
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    updateRow(result.data);
    toast.success('Cita confirmada.');
    router.refresh();
  }

  async function confirmReject(row: AgendaRow) {
    setActionError(null);
    const result = await run(() =>
      cancelAppointment({ appointmentId: row.id, reason: rejectReason.trim() || 'No disponible' }),
    );
    if (!result) return;
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    updateRow(result.data);
    setModal(null);
    toast.success('Cita rechazada.');
    router.refresh();
  }

  async function confirmReschedule(row: AgendaRow) {
    setActionError(null);
    const start = new Date(`${rescheduleForm.date}T${rescheduleForm.time}:00`);
    if (!rescheduleForm.date || Number.isNaN(start.getTime())) {
      setActionError('Selecciona una fecha y una hora válidas.');
      return;
    }
    const result = await run(() =>
      rescheduleAppointment({ appointmentId: row.id, startAt: start.toISOString() }),
    );
    if (!result) return;
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    updateRow(result.data);
    setModal(null);
    toast.success('Cita reprogramada.');
    router.refresh();
  }

  function openCreate() {
    setCreateError(null);
    setForm((prev) => ({ ...prev, date: from }));
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
      currency: created.appliedCurrency,
      payment: created.payment,
      notifications: created.notifications,
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
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {dayKey(row.startAt)} · {formatTime(row.startAt)}
          </Typography>
        </Stack>
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
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {row.status === 'pending' ? (
            <Button variant="primary" onClick={() => void accept(row)} disabled={saving}>
              Aceptar
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => setModal({ kind: 'detail', row })}>
            Detalles
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
            <Typography variant="h5" component="h1">
              Agenda de citas
            </Typography>
            <Button variant="primary" onClick={openCreate}>
              + Nueva cita
            </Button>
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField label="Desde" type="date" value={from} onChange={setFrom} />
            <TextField label="Hasta" type="date" value={to} onChange={setTo} />
            <Button variant="secondary" onClick={applyRange}>
              Aplicar
            </Button>
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
      }
    >
      <ApiErrorDialog title="No se pudo cargar la agenda" message={error} />
      <ApiErrorDialog title="No se pudo completar la acción" message={actionError} />
      <DataTable
        columns={columns}
        rows={visible}
        dense
        emptyMessage="No hay citas en este periodo."
        getRowKey={(row) => row.id}
      />

      {modal?.kind === 'create' ? (
        <CreateAppointmentDialog
          open
          form={form}
          services={services}
          resources={resources}
          error={createError}
          saving={saving}
          onClose={() => setModal(null)}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          onSave={saveCreate}
        />
      ) : null}

      {modal?.kind === 'detail' ? (
        <AppointmentDetailDialog
          row={modal.row}
          saving={saving}
          onClose={() => setModal(null)}
          onAccept={() => void accept(modal.row)}
          onReject={() => {
            setActionError(null);
            setRejectReason('No disponible');
            setModal({ kind: 'reject', row: modal.row });
          }}
          onReschedule={() => {
            setActionError(null);
            setRescheduleForm({
              date: dayKey(modal.row.startAt),
              time: formatTime(modal.row.startAt),
            });
            setModal({ kind: 'reschedule', row: modal.row });
          }}
        />
      ) : null}

      {modal?.kind === 'reject' ? (
        <RejectAppointmentDialog
          open
          clientName={modal.row.clientName}
          reason={rejectReason}
          error={actionError}
          saving={saving}
          onReasonChange={setRejectReason}
          onConfirm={() => void confirmReject(modal.row)}
          onCancel={() => setModal(null)}
        />
      ) : null}

      {modal?.kind === 'reschedule' ? (
        <RescheduleAppointmentDialog
          open
          clientName={modal.row.clientName}
          date={rescheduleForm.date}
          time={rescheduleForm.time}
          error={actionError}
          saving={saving}
          onChange={(patch) => setRescheduleForm((prev) => ({ ...prev, ...patch }))}
          onConfirm={() => void confirmReschedule(modal.row)}
          onCancel={() => setModal(null)}
        />
      ) : null}
    </Card>
  );
}
