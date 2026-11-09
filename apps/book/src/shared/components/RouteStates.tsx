import { Button, Card, Container, Stack, Typography } from '@foundly/ui';
import { ModuleSkeleton } from './ModuleSkeleton';

/** Route-level loading fallback (lazy routes and session resolution). */
export function RouteLoading({ rows = 4 }: { rows?: number }) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <ModuleSkeleton rows={rows} />
    </Container>
  );
}

export interface RouteErrorProps {
  message?: string;
  onRetry?: () => void;
}

/** Recoverable route-level error: never a blank screen (feature 024). */
export function RouteError({
  message = 'No pudimos cargar la información.',
  onRetry,
}: RouteErrorProps) {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h6" component="h1">
            Algo no salió bien
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
          {onRetry ? (
            <Button onClick={onRetry}>Reintentar</Button>
          ) : null}
        </Stack>
      </Card>
    </Container>
  );
}
