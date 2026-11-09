'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import { Stack, Typography } from '@foundly/ui';
import { formatDate, subscriptionStatusLabel, subscriptionStatusTone } from '../utils/format';
import type { SubscriptionSummaryView, SubscriptionUsageView } from '../utils/types';

function UsageRow({ label, usage }: { label: string; usage: SubscriptionUsageView }) {
  const percent = usage.unlimited ? 0 : Math.min(100, (usage.used / Math.max(1, usage.limit)) * 100);
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {usage.unlimited ? 'Ilimitado' : `${usage.used} / ${usage.limit}`}
        </Typography>
      </Stack>
      {!usage.unlimited ? (
        <LinearProgress variant="determinate" value={percent} aria-label={`${label}: ${usage.used} de ${usage.limit}`} />
      ) : null}
    </Stack>
  );
}

export function PlanSummaryCard({ subscription }: { subscription: SubscriptionSummaryView }) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
          <Stack spacing={0.5}>
            <Typography variant="overline" color="text.secondary">
              Plan actual
            </Typography>
            <Typography variant="h5" component="h2">
              {subscription.effectivePlan === 'PRO' ? 'Pro' : 'Free'}
            </Typography>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            <Chip
              size="small"
              color={subscriptionStatusTone(subscription.status)}
              label={subscriptionStatusLabel(subscription.status)}
            />
            {subscription.expiresAt ? (
              <Typography variant="caption" color="text.secondary">
                Vence el {formatDate(subscription.expiresAt)}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Sin vencimiento
              </Typography>
            )}
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <UsageRow label="Servicios activos" usage={subscription.limits.services} />
          <UsageRow label="Equipo activo" usage={subscription.limits.team} />
        </Box>
      </Stack>
    </Paper>
  );
}
