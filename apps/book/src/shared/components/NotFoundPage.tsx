import { Card, Container, Stack, Typography } from '@foundly/ui';
import { Link } from 'react-router-dom';
import { PageMeta } from './PageMeta';

/** Branded 404 for unknown SPA routes (feature 024). */
export function NotFoundPage() {
  return (
    <>
      <PageMeta title="Página no encontrada" />
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Card>
          <Stack spacing={2} alignItems="flex-start">
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Página no encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              La dirección que buscas no existe o cambió de lugar.
            </Typography>
            <Link to="/">Volver al inicio</Link>
          </Stack>
        </Card>
      </Container>
    </>
  );
}
