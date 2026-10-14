import Box from '@mui/material/Box';
import { Badge, Card, Stack, Typography } from '@foundly/ui';
import type { PlatformMetricsView } from '../utils/types';

export interface PlanDistributionProps {
  metrics: PlatformMetricsView;
}

/** FREE vs PRO distribution with counts and a proportional bar. */
export function PlanDistribution({ metrics }: PlanDistributionProps) {
  const total = metrics.plansFree + metrics.plansPro;
  const proPercent = total > 0 ? Math.round((metrics.plansPro / total) * 100) : 0;

  return (
    <Card
      header={
        <Typography variant="h6" component="h2">
          Distribución de planes
        </Typography>
      }
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Badge pill status="neutral">
            {`FREE ${metrics.plansFree}`}
          </Badge>
          <Badge pill status="positive">
            {`PRO ${metrics.plansPro}`}
          </Badge>
          <Typography variant="body2" color="text.secondary">
            {`${proPercent}% en PRO`}
          </Typography>
        </Stack>
        <Box
          role="img"
          aria-label={`Distribución de planes: ${metrics.plansFree} FREE, ${metrics.plansPro} PRO`}
          sx={{
            display: 'flex',
            height: 10,
            borderRadius: '9999px',
            overflow: 'hidden',
            backgroundColor: 'surface.badgePill',
          }}
        >
          <Box sx={{ width: `${proPercent}%`, backgroundColor: 'primary.main' }} />
        </Box>
      </Stack>
    </Card>
  );
}
