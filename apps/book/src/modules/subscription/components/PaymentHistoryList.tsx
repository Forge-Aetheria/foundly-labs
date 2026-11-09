'use client';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { Stack, Typography } from '@foundly/ui';
import {
  formatAmount,
  formatDate,
  gatewayLabel,
  paymentStatusLabel,
  paymentStatusTone,
} from '../utils/format';
import type { PaymentTransactionView } from '../utils/types';

export interface PaymentHistoryListProps {
  items: PaymentTransactionView[];
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function PaymentHistoryList({
  items,
  loading = false,
  error,
  hasMore = false,
  onLoadMore,
}: PaymentHistoryListProps) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }} variant="outlined">
      <Stack spacing={1.5}>
        <Typography variant="h6" component="h2">
          Historial de pagos
        </Typography>

        {error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : null}

        {loading && items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Cargando pagos…
          </Typography>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aún no tienes pagos registrados. Elige un método para comenzar.
          </Typography>
        ) : null}

        {items.map((item, index) => (
          <Stack key={item.id} spacing={1}>
            {index > 0 ? <Divider /> : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
              <Stack spacing={0.25}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {gatewayLabel(item.gateway)} · {formatAmount(item.amount, item.currency)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(item.createdAt)}
                  {item.referenceNumber ? ` · Ref. ${item.referenceNumber}` : ''}
                </Typography>
                {item.expiresAt ? (
                  <Typography variant="caption" color="text.secondary">
                    Vigencia hasta {formatDate(item.expiresAt)}
                  </Typography>
                ) : null}
              </Stack>
              <Chip
                size="small"
                color={paymentStatusTone(item.status)}
                label={paymentStatusLabel(item.status)}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            </Stack>
          </Stack>
        ))}

        {hasMore ? (
          <Button variant="text" onClick={onLoadMore} disabled={loading}>
            {loading ? 'Cargando…' : 'Cargar más'}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
