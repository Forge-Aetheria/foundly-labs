import Link from 'next/link';
import Box from '@mui/material/Box';
import { Card, Stack, Typography } from '@foundly/ui';
import { BusinessCard } from './BusinessCard';
import type { DirectoryBusiness } from '../utils/types';

export interface BusinessCardGridProps {
  businesses: DirectoryBusiness[];
  query: string;
}

function StatePanel({
  title,
  description,
  clearSearch = false,
}: {
  title: string;
  description: string;
  clearSearch?: boolean;
}) {
  return (
    <Card header={<Typography variant="h6" component="h2">{title}</Typography>}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        {clearSearch ? (
          <Box>
            <Link href="/negocios">Ver todos los negocios</Link>
          </Box>
        ) : null}
      </Stack>
    </Card>
  );
}

/** Responsive directory grid with distinct empty and no-results states. */
export function BusinessCardGrid({ businesses, query }: BusinessCardGridProps) {
  if (businesses.length === 0) {
    return query.trim().length > 0 ? (
      <StatePanel
        title="Sin resultados"
        description="No encontramos negocios para esa búsqueda. Prueba con otro término."
        clearSearch
      />
    ) : (
      <StatePanel
        title="Todavía no hay negocios"
        description="Vuelve pronto: los negocios que se registren aparecerán aquí."
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
      }}
    >
      {businesses.map((business) => (
        <BusinessCard key={business.tenantId} business={business} />
      ))}
    </Box>
  );
}
