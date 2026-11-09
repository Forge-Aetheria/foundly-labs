'use client';

import { useState, type FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import { Stack, Typography } from '@foundly/ui';
import { zodFields } from '../../../shared/types/result';
import { manualPaymentSchema } from '../utils/schemas';
import type { ManualPaymentValues } from '../utils/types';

export interface ManualPaymentFormProps {
  submitting?: boolean;
  serverError?: string | null;
  fieldErrors?: Record<string, string>;
  onSubmit: (values: ManualPaymentValues) => void | Promise<void>;
}

export function ManualPaymentForm({
  submitting = false,
  serverError,
  fieldErrors = {},
  onSubmit,
}: ManualPaymentFormProps) {
  const [values, setValues] = useState<ManualPaymentValues>({
    gateway: 'PAGO_MOVIL',
    referenceNumber: '',
    bank: '',
    amount: '',
    currency: 'USD',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof ManualPaymentValues>(key: K, value: ManualPaymentValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = manualPaymentSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFields(parsed.error));
      return;
    }
    setErrors({});
    await onSubmit(parsed.data);
  }

  const allErrors = { ...fieldErrors, ...errors };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }} variant="outlined">
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6" component="h2">
              Reportar pago manual
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tu pago quedará pendiente hasta que el equipo lo apruebe.
            </Typography>
          </Stack>

          {serverError ? <Alert severity="error">{serverError}</Alert> : null}

          <TextField
            select
            fullWidth
            label="Método"
            value={values.gateway}
            onChange={(event) =>
              set('gateway', event.target.value as ManualPaymentValues['gateway'])
            }
            disabled={submitting}
          >
            <MenuItem value="PAGO_MOVIL">Pago Móvil</MenuItem>
            <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Número de referencia"
            value={values.referenceNumber}
            onChange={(event) => set('referenceNumber', event.target.value)}
            error={Boolean(allErrors.referenceNumber)}
            helperText={allErrors.referenceNumber}
            disabled={submitting}
            required
          />

          <TextField
            fullWidth
            label="Banco emisor"
            value={values.bank}
            onChange={(event) => set('bank', event.target.value)}
            error={Boolean(allErrors.bank)}
            helperText={allErrors.bank}
            disabled={submitting}
            required
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <TextField
              fullWidth
              label="Monto transferido"
              value={values.amount}
              onChange={(event) => set('amount', event.target.value)}
              error={Boolean(allErrors.amount)}
              helperText={allErrors.amount}
              disabled={submitting}
              inputMode="decimal"
              required
            />
            <TextField
              select
              fullWidth
              label="Moneda"
              value={values.currency}
              onChange={(event) =>
                set('currency', event.target.value as ManualPaymentValues['currency'])
              }
              disabled={submitting}
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="VES">VES (bolívares)</MenuItem>
            </TextField>
          </Stack>

          <TextField
            fullWidth
            label="Teléfono del pago"
            value={values.phone}
            onChange={(event) => set('phone', event.target.value)}
            error={Boolean(allErrors.phone)}
            helperText={allErrors.phone}
            disabled={submitting}
            required
          />

          <Button type="submit" variant="contained" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? 'Enviando…' : 'Enviar pago para aprobación'}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
