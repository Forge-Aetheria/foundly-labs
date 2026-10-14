'use client';

import { useEffect, useState } from 'react';
import { Button, Chip, Modal, Stack, TextField, Typography } from '@foundly/ui';
import { errorMessage } from '../../../shared/api/error-surface';
import { useOverrideSubscription } from '../hooks';
import type {
  ManagedBusinessView,
  OverrideInput,
  PlanValue,
  StatusValue,
} from '../utils/types';

const PLANS: PlanValue[] = ['FREE', 'PRO'];

const STATUSES: { value: StatusValue; label: string }[] = [
  { value: 'active', label: 'Activa' },
  { value: 'past_due', label: 'Pago pendiente' },
  { value: 'expired', label: 'Vencida' },
  { value: 'canceled', label: 'Cancelada' },
];

export interface OverrideSubscriptionDialogProps {
  open: boolean;
  business: ManagedBusinessView | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Super Admin override dialog (feature 020): plan, status and expiry, validated before submit. */
export function OverrideSubscriptionDialog({
  open,
  business,
  onClose,
  onSaved,
}: OverrideSubscriptionDialogProps) {
  const submit = useOverrideSubscription();
  const [plan, setPlan] = useState<PlanValue>('FREE');
  const [status, setStatus] = useState<StatusValue>('active');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && business) {
      setPlan(business.plan);
      setStatus(business.status);
      setExpiryDate(business.expiresAt ? business.expiresAt.slice(0, 10) : '');
      setError(null);
    }
  }, [open, business]);

  if (!business) {
    return null;
  }

  const initialDate = business.expiresAt ? business.expiresAt.slice(0, 10) : '';

  const handleConfirm = async () => {
    const input: OverrideInput = { tenantId: business.tenantId };
    let changed = false;
    if (plan !== business.plan) {
      input.plan = plan;
      changed = true;
    }
    if (status !== business.status) {
      input.status = status;
      changed = true;
    }
    if (expiryDate !== initialDate) {
      changed = true;
      input.expiresAt = expiryDate
        ? new Date(`${expiryDate}T00:00:00.000Z`).toISOString()
        : null;
    }
    if (!changed) {
      setError('Cambia al menos un campo.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await submit(input);
    setBusy(false);
    if (!result.ok) {
      setError(errorMessage(result.error.code));
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Editar suscripción — ${business.name}`}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void handleConfirm()} loading={busy}>
            Guardar
          </Button>
        </>
      }
    >
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Plan
          </Typography>
          <Stack direction="row" spacing={1}>
            {PLANS.map((option) => (
              <Chip
                key={option}
                label={option}
                selectable
                selected={plan === option}
                onClick={() => setPlan(option)}
              />
            ))}
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Estado
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {STATUSES.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selectable
                selected={status === option.value}
                onClick={() => setStatus(option.value)}
              />
            ))}
          </Stack>
        </Stack>

        <TextField
          label="Fecha de vencimiento"
          type="date"
          value={expiryDate}
          onChange={setExpiryDate}
        />

        {error ? (
          <Typography variant="body2" sx={{ color: 'error.main' }} role="alert">
            {error}
          </Typography>
        ) : null}
      </Stack>
    </Modal>
  );
}
