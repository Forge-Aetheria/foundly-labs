'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import { Card, Stack, Typography } from '@foundly/ui';
import { SECONDARY_BUTTON_SX } from '../../../shared/utils/landingCanon';
import { BusinessCard } from './BusinessCard';
import type { DirectoryBusiness } from '../utils/types';

export interface BusinessCardGridProps {
  businesses: DirectoryBusiness[];
  query: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

function StatePanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card header={<Typography variant="h6" component="h2">{title}</Typography>}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        {action}
      </Stack>
    </Card>
  );
}

/** Responsive directory grid (3/2/1 columns) with distinct empty and no-results states. */
export function BusinessCardGrid({
  businesses,
  query,
  hasFilters = query.trim().length > 0,
  onClearFilters,
}: BusinessCardGridProps) {
  if (businesses.length === 0) {
    return hasFilters ? (
      <StatePanel
        title="Sin resultados"
        description="No encontramos negocios con esos filtros. Prueba con otro término o categoría."
        action={
          <Box>
            <MuiLink
              component={Link}
              href="/negocios"
              underline="none"
              onClick={onClearFilters}
              sx={[
                SECONDARY_BUTTON_SX,
                {
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1,
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.primary',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&:visited': { color: 'text.primary' },
                },
              ]}
            >
              Ver todos los negocios
            </MuiLink>
          </Box>
        }
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
        width: '100%',
        alignItems: 'stretch',
        gap: 3,
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          md: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {businesses.map((business) => (
        <BusinessCard key={business.tenantId} business={business} />
      ))}
    </Box>
  );
}
