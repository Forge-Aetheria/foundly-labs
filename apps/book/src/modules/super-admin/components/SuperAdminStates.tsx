import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Link from 'next/link';
import { Card, Stack, Typography } from '@foundly/ui';

/** Non-admin state: clear denial with a path back, and no platform data. */
export function AccessDenied() {
  return (
    <Card
      header={
        <Typography variant="h5" component="h1">
          Acceso restringido
        </Typography>
      }
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Esta consola es exclusiva del administrador de la plataforma Foundly Labs.
        </Typography>
        <Link href="/admin/agenda">Volver al panel de mi negocio</Link>
      </Stack>
    </Card>
  );
}

/** Loading skeleton for the dashboard and the businesses table. */
export function DashboardSkeleton() {
  return (
    <Stack spacing={3} aria-busy="true" aria-label="Cargando consola">
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        }}
      >
        {[0, 1, 2, 3].map((key) => (
          <Card key={key}>
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="35%" height={40} />
          </Card>
        ))}
      </Box>
      <Card>
        <Stack spacing={1}>
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} variant="text" width="100%" />
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
