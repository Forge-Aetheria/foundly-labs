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
        gap: 3,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
      }}
      aria-busy="true"
      aria-label="Cargando negocios"
    >
      {[0, 1, 2, 3, 4, 5].map((key) => (
        <Card key={key}>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={120} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="80%" />
          </Stack>
        </Card>
      ))}
    </Box>
  );
}

/** Friendly error state with a retry that re-runs the server read. */
export function DirectoryError() {
  const router = useRouter();
  return (
    <Card
      header={
        <Typography variant="h6" component="h2">
          No pudimos cargar el directorio
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
