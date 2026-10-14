import { Container, Stack, Typography } from '@foundly/ui';
import { BusinessCardGrid } from './components/BusinessCardGrid';
import { DirectoryError } from './components/DirectoryStates';
import { DirectorySearch } from './components/DirectorySearch';
import type { DirectoryBusiness } from './utils/types';

export interface DirectoryViewProps {
  query: string;
  businesses: DirectoryBusiness[];
  error: boolean;
}

/** Public directory view (server): header, debounced search and the business grid/states. */
export function DirectoryView({ query, businesses, error }: DirectoryViewProps) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h3" component="h1">
            Directorio de negocios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Descubre negocios y reserva tu cita en segundos.
          </Typography>
        </Stack>
        <DirectorySearch value={query} />
        {error ? (
          <DirectoryError />
        ) : (
          <BusinessCardGrid businesses={businesses} query={query} />
        )}
      </Stack>
    </Container>
  );
}
