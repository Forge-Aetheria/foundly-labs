import { useState } from 'react';
import { Badge, Button, Card, Modal, Stack, Typography } from '@foundly/ui';
import { PAYMENT_METHOD_LABELS } from '../../../../shared/types/payments';
import { formatPrice } from '../../../../shared/utils/format';
import { STATUS_BADGE, STATUS_LABEL, dayKey, formatTime } from '../../utils/status';
import type { AgendaRow } from '../../utils/types';

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

export interface AppointmentDetailDialogProps {
  row: AgendaRow;
  saving: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onReschedule: () => void;
}

/** Appointment detail modal with lifecycle actions (feature 011/017). */
export function AppointmentDetailDialog({
  row,
  saving,
  onClose,
  onAccept,
  onReject,
  onReschedule,
}: AppointmentDetailDialogProps) {
  return (
    <Modal open onClose={onClose} title={`Detalle · ${row.clientName}`}>
      <Stack spacing={1}>
        <Typography variant="body2">
          Cliente: <strong>{row.clientName}</strong>
        </Typography>
        {row.clientContact ? (
          <Typography variant="body2" color="text.secondary">
            Contacto: {row.clientContact}
          </Typography>
        ) : null}
        <Typography variant="body2">
          Fecha y hora: {dayKey(row.startAt)} · {formatTime(row.startAt)}
        </Typography>
        <Typography variant="body2">Servicio: {row.serviceName}</Typography>
        <Typography variant="body2">Profesional: {row.resourceName}</Typography>
        <Badge pill status={STATUS_BADGE[row.status] ?? 'neutral'}>
          {STATUS_LABEL[row.status] ?? row.status}
        </Badge>

        {row.payment ? (
          <Card sx={{ p: 2 }}>
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Adelanto
              </Typography>
              <Typography variant="body2">
                Método: {PAYMENT_METHOD_LABELS[row.payment.methodType]}
              </Typography>
              <Typography variant="body2">
                Monto: {formatPrice(row.payment.amountCents, row.currency)}
              </Typography>
              <Typography variant="body2">Referencia: {row.payment.reference}</Typography>
              <ProofPreview url={row.payment.proofUrl} />
            </Stack>
          </Card>
        ) : null}

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {row.status === 'pending' ? (
            <Button variant="secondary" onClick={onAccept} disabled={saving}>
              Aceptar
            </Button>
          ) : null}
          {row.status === 'pending' || row.status === 'confirmed' ? (
            <>
              <Button variant="secondary" onClick={onReject} disabled={saving}>
                Rechazar
              </Button>
              <Button variant="secondary" onClick={onReschedule} disabled={saving}>
                Reagendar
              </Button>
            </>
          ) : null}
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
