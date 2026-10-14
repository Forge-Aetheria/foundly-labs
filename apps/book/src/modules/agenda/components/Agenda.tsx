'use client';

import { useState } from 'react';
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
import type {
  Appointment,
  AppointmentNotification,
  Resource,
  Service,
} from '../../../shared/types/appointments';
import type { AdvancePayment } from '../../../shared/types/payments';
import { PAYMENT_METHOD_LABELS } from '../../../shared/types/payments';
import { formatPrice } from '../../../shared/utils/format';
import {
  useCancelAppointment,
  useChangeAppointmentStatus,
  useCreateAppointment,
  useRescheduleAppointment,
} from '../hooks';
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
  currency: string;
  payment: AdvancePayment | null;
  notifications: AppointmentNotification[];
}

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

function ProofPreview({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">Comprobante:</Typography>
      {broken ? null : (
        <img
          src={url}
          alt="Comprobante del adelanto"
          style={{ maxWidth: 220, borderRadius: 8, display: 'block' }}
          onError={() => setBroken(true)}
        />
      )}
      <a href={url} target="_blank" rel="noreferrer">
        Abrir comprobante
      </a>
    </Stack>
  );
}

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
    const result = await run(() =>
      changeStatus({ appointmentId: row.id, status: 'confirmed' }),
    );
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

            {modal.row.payment ? (
              <Card sx={{ p: 2 }}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Adelanto
                  </Typography>
                  <Typography variant="body2">
                    Método: {PAYMENT_METHOD_LABELS[modal.row.payment.methodType]}
                  </Typography>
                  <Typography variant="body2">
                    Monto: {formatPrice(modal.row.payment.amountCents, modal.row.currency)}
                  </Typography>
                  <Typography variant="body2">
                    Referencia: {modal.row.payment.reference}
                  </Typography>
                  <ProofPreview url={modal.row.payment.proofUrl} />
                </Stack>
              </Card>
            ) : null}

            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {modal.row.status === 'pending' ? (
                <Button variant="secondary" onClick={() => void accept(modal.row)} disabled={saving}>
                  Aceptar
                </Button>
              ) : null}
              {modal.row.status === 'pending' || modal.row.status === 'confirmed' ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActionError(null);
                      setRejectReason('No disponible');
                      setModal({ kind: 'reject', row: modal.row });
                    }}
                    disabled={saving}
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActionError(null);
                      setRescheduleForm({
                        date: dayKey(modal.row.startAt),
                        time: formatTime(modal.row.startAt),
                      });
                      setModal({ kind: 'reschedule', row: modal.row });
                    }}
                    disabled={saving}
                  >
                    Reagendar
                  </Button>
                </>
              ) : null}
              <Button variant="primary" onClick={() => setModal(null)}>
                Cerrar
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}

      {modal?.kind === 'reject' ? (
        <Modal open onClose={() => setModal(null)} title="Rechazar cita">
          <Stack spacing={2}>
            <Typography variant="body2">
              ¿Rechazar la cita de {modal.row.clientName}? El cliente recibirá una notificación.
            </Typography>
            <TextField label="Motivo" value={rejectReason} onChange={setRejectReason} fullWidth />
            {actionError ? (
              <Typography variant="body2" color="error" role="alert">
                {actionError}
              </Typography>
            ) : null}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => void confirmReject(modal.row)} loading={saving}>
                Rechazar
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}

      {modal?.kind === 'reschedule' ? (
        <Modal open onClose={() => setModal(null)} title="Reagendar cita">
          <Stack spacing={2}>
            <Typography variant="body2">
              Nueva fecha y hora para {modal.row.clientName}.
            </Typography>
            <TextField
              label="Fecha"
              type="date"
              value={rescheduleForm.date}
              onChange={(value) => setRescheduleForm((prev) => ({ ...prev, date: value }))}
            />
            <TextField
              label="Hora"
              type="time"
              value={rescheduleForm.time}
              onChange={(value) => setRescheduleForm((prev) => ({ ...prev, time: value }))}
            />
            {actionError ? (
              <Typography variant="body2" color="error" role="alert">
                {actionError}
              </Typography>
            ) : null}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => void confirmReschedule(modal.row)} loading={saving}>
                Reagendar
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}
    </Card>
  );
}
