import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { Card, Stack } from '@foundly/ui';

export interface ModuleSkeletonProps {
  /** Number of placeholder rows in the main card. */
  rows?: number;
}

/**
 * Shared admin module skeleton: title block, a row of summary cards and a main
 * content card with pulsing rows. Used both as the route-level `loading.tsx`
 * fallback and inside each page's `<Suspense>` boundary so the URL changes
 * immediately while server data streams in.
 */
export function ModuleSkeleton({ rows = 4 }: ModuleSkeletonProps) {
  return (
    <Stack spacing={3} aria-busy="true" aria-label="Cargando módulo">
      <Stack spacing={1}>
        <Skeleton variant="text" width={220} height={44} />
        <Skeleton variant="text" width="48%" height={22} />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        }}
      >
        {[0, 1, 2].map((key) => (
          <Card key={key}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Skeleton variant="circular" width={38} height={38} />
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="55%" />
                  <Skeleton variant="text" width="35%" height={16} />
                </Stack>
              </Stack>
              <Skeleton variant="text" width="80%" height={16} />
            </Stack>
          </Card>
        ))}
      </Box>

      <Card
        header={
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Skeleton variant="text" width={180} height={32} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Stack>
        }
      >
        <Stack spacing={1.5}>
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={56} />
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
