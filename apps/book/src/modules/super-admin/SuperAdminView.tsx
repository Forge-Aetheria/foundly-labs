import Link from 'next/link';
import { Container, Stack, Typography } from '@foundly/ui';
import { ErrorState } from './components/ErrorState';
import { ManagedBusinessesTable } from './components/ManagedBusinessesTable';
import { MetricsCards } from './components/MetricsCards';
import { PlanDistribution } from './components/PlanDistribution';
import { SuperAdminSearch } from './components/SuperAdminSearch';
import { AccessDenied } from './components/SuperAdminStates';
import type { ManagedBusinessView, PlatformMetricsView } from './utils/types';

export const SUPER_ADMIN_PAGE_SIZE = 20;

export interface SuperAdminViewProps {
  query: string;
  page: number;
  metrics: PlatformMetricsView | null;
  businesses: ManagedBusinessView[];
  denied: boolean;
  error: boolean;
}

function Pagination({ query, page, hasNext }: { query: string; page: number; hasNext: boolean }) {
  const prefix = query ? `/super-admin?q=${encodeURIComponent(query)}&` : '/super-admin?';
  return (
    <Stack direction="row" spacing={2} justifyContent="flex-end">
      {page > 1 ? <Link href={`${prefix}page=${page - 1}`}>Anterior</Link> : null}
      {hasNext ? <Link href={`${prefix}page=${page + 1}`}>Siguiente</Link> : null}
    </Stack>
  );
}

/** Super Admin console view (server): header, dashboard, search and the businesses table. */
export function SuperAdminView({
  query,
  page,
  metrics,
  businesses,
  denied,
  error,
}: SuperAdminViewProps) {
  if (denied) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <AccessDenied />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h3" component="h1">
            Consola Super Admin
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Métricas globales de la plataforma y gestión de suscripciones.
          </Typography>
        </Stack>

        {error ? (
          <ErrorState />
        ) : (
          <>
            {metrics ? (
              <>
                <MetricsCards metrics={metrics} />
                <PlanDistribution metrics={metrics} />
              </>
            ) : null}
            <SuperAdminSearch value={query} />
            <ManagedBusinessesTable businesses={businesses} />
            <Pagination
              query={query}
              page={page}
              hasNext={businesses.length === SUPER_ADMIN_PAGE_SIZE}
            />
          </>
        )}
      </Stack>
    </Container>
  );
}
