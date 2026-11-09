'use client';

import Paper from '@mui/material/Paper';
import { Stack, Typography } from '@foundly/ui';
import type { ManualPaymentInstructionsView } from '../utils/types';

export function ManualPaymentInstructions({
  instructions,
}: {
  instructions: ManualPaymentInstructionsView;
}) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }} variant="outlined">
      <Stack spacing={1}>
        <Typography variant="h6" component="h2">
          Datos para Pago Móvil o Transferencia
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Usa estos datos para realizar el pago y luego reporta la referencia.
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2">
            <strong>Banco:</strong> {instructions.bank}
          </Typography>
          <Typography variant="body2">
            <strong>Cédula/RIF:</strong> {instructions.cedula}
          </Typography>
          <Typography variant="body2">
            <strong>Teléfono:</strong> {instructions.phone}
          </Typography>
          <Typography variant="body2">
            <strong>Tasa de referencia:</strong> {instructions.rateVesPerUsd} VES/USD
          </Typography>
          {instructions.note ? (
            <Typography variant="body2" color="text.secondary">
              {instructions.note}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
