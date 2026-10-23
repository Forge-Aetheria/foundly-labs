'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { Button, Card, Stack, Typography } from '@foundly/ui';
import { useRouter } from 'next/navigation';

/** Loading skeleton grid shown while the directory data resolves. */
export function DirectorySkeleton() {
  return (
    <Box
      sx={{
        display: 'grid',
        width: '100%',
        alignItems: 'stretch',
        gap: 3,
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          md: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
      }}
      aria-busy="true"
      aria-label="Cargando negocios"
    >
      {[0, 1, 2, 3, 4, 5].map((key) => (
        <Card key={key}>
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={160} />
            <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ mt: -6 }}>
              <Skeleton variant="circular" width={68} height={68} />
              <Stack spacing={0.75} sx={{ flex: 1 }}>
                <Skeleton variant="text" width="65%" height={28} />
                <Skeleton variant="rounded" width={92} height={22} />
              </Stack>
            </Stack>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" height={40} sx={{ flex: 1 }} />
              <Skeleton variant="rounded" height={40} sx={{ flex: 1 }} />
            </Stack>
          </Stack>
        </Card>
      ))}
    </Box>
  );
}

/** Friendly error state with a retry that re-runs the read. */
export function DirectoryError() {
  const router = useRouter();
  return (
    <Card
      header={
        <Typography variant="h6" component="h2">
          No pudimos cargar los negocios
        </Typography>
      }
    >
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="body2" color="text.secondary">
          Ocurrió un problema al cargar los negocios. Vuelve a intentarlo.
        </Typography>
        <Button variant="primary" onClick={() => router.refresh()}>
          Reintentar
        </Button>
      </Stack>
    </Card>
  );
}
