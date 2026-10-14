'use client';

import { useRouter } from 'next/navigation';
import { Button, Card, Stack, Typography } from '@foundly/ui';

/** Friendly error state with a retry that re-runs the server read. */
export function ErrorState() {
  const router = useRouter();
  return (
    <Card
      header={
        <Typography variant="h6" component="h2">
          No pudimos cargar la consola
        </Typography>
      }
    >
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="body2" color="text.secondary">
          Ocurrió un problema al cargar las métricas y los negocios. Vuelve a intentarlo.
        </Typography>
        <Button variant="primary" onClick={() => router.refresh()}>
          Reintentar
        </Button>
      </Stack>
    </Card>
  );
}
