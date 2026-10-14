import Box from '@mui/material/Box';
import { Card, Typography } from '@foundly/ui';
import type { PlatformMetricsView } from '../utils/types';

export interface MetricsCardsProps {
  metrics: PlatformMetricsView;
}

function Stat({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <Card>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="h4"
        component="p"
        sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: muted ? 'text.muted' : 'text.primary' }}
      >
        {value}
      </Typography>
    </Card>
  );
}

/** Dashboard summary cards: businesses total/active, users (or unavailable) and PRO conversion. */
export function MetricsCards({ metrics }: MetricsCardsProps) {
  const usersValue = metrics.usersAvailable ? String(metrics.usersTotal ?? 0) : 'No disponible';
  const conversion = `${Math.round(metrics.proConversion * 100)}%`;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
      }}
    >
      <Stat label="Total negocios" value={String(metrics.businessesTotal)} />
      <Stat label="Negocios activos" value={String(metrics.businessesActive)} />
      <Stat label="Total usuarios" value={usersValue} muted={!metrics.usersAvailable} />
      <Stat label="Conversión a PRO" value={conversion} />
    </Box>
  );
}
