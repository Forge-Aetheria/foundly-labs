'use client';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { Stack, Typography } from '@foundly/ui';

export type ManualGateway = 'PAGO_MOVIL' | 'TRANSFERENCIA';

export interface PaymentMethodSelectorProps {
  onPaypal: () => void;
  onBinance: () => void;
  onSelectManual: (gateway: ManualGateway) => void;
  busy?: boolean;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  onPaypal,
  onBinance,
  onSelectManual,
  busy = false,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const isDisabled = disabled || busy;
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6" component="h2">
            Renovar o mejorar tu plan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Elige cómo quieres pagar. PayPal y Binance se confirman automáticamente; Pago Móvil y
            Transferencia quedan pendientes de aprobación.
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          <Button
            variant="contained"
            startIcon={<PaymentsOutlinedIcon />}
            onClick={onPaypal}
            disabled={isDisabled}
            aria-busy={busy || undefined}
          >
            Pagar con PayPal
          </Button>
          <Button
            variant="outlined"
            startIcon={<CurrencyBitcoinIcon />}
            onClick={onBinance}
            disabled={isDisabled}
            aria-busy={busy || undefined}
          >
            Pagar con Binance Pay
          </Button>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2" component="h3">
            Pago móvil o transferencia
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
            <Button
              variant="outlined"
              startIcon={<AccountBalanceWalletOutlinedIcon />}
              onClick={() => onSelectManual('PAGO_MOVIL')}
              disabled={isDisabled}
            >
              Pago Móvil
            </Button>
            <Button
              variant="outlined"
              startIcon={<AccountBalanceWalletOutlinedIcon />}
              onClick={() => onSelectManual('TRANSFERENCIA')}
              disabled={isDisabled}
            >
              Transferencia
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
