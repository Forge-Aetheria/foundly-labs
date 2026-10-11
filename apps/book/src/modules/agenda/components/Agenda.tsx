'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  DataTable,
  Modal,
  Stack,
  TextField,
  Typography,
  type BadgeStatus,
  type DataTableColumn,
} from '@foundly/ui';

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
export function Agenda({ appointments }: AgendaProps) {
  const [rows, setRows] = useState<AgendaRow[]>(appointments);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceName: '',
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
    setForm((prev) => ({ ...prev, date: selectedDate ?? '' }));
    setModal({ kind: 'create' });
  }

  function saveCreate() {
    const startAt = `${form.date}T${form.time}:00`;
    const endAt = `${form.date}T${String((Number(form.time.slice(0, 2)) + 1) % 24).padStart(2, '0')}:${form.time.slice(3, 5)}:00`;
    const newRow: AgendaRow = {
      id: crypto.randomUUID(),
      startAt,
      endAt,
      clientName: form.clientName || '—',
      clientContact:
        form.clientEmail || form.clientPhone ? `${form.clientEmail} · ${form.clientPhone}` : null,
      serviceName: form.serviceName || '—',
      durationMinutes: 30,
      resourceName: '—',
      status: 'pending',
    };
    setRows((prev) => [newRow, ...prev]);
    setForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      serviceName: '',
      date: '',
      time: '09:00',
    });
    setModal(null);
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
            <TextField
              label="Servicio"
              value={form.serviceName}
              onChange={(value) => setForm((prev) => ({ ...prev, serviceName: value }))}
            />
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
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="secondary" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={saveCreate}>
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
