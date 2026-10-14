import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import Link from 'next/link';
import { Badge, Card, Stack, Typography } from '@foundly/ui';
import { BusinessDescription } from './BusinessDescription';
import { formatDirectoryHours } from '../utils/hours';
import type { DirectoryBusiness } from '../utils/types';

export interface BusinessCardProps {
  business: DirectoryBusiness;
}

/** Public directory card (feature 019): identity, location, general hours and a "Ver perfil" CTA. */
export function BusinessCard({ business }: BusinessCardProps) {
  const hours = formatDirectoryHours(business.hours);
  const initial = business.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <Card
      sx={{ height: '100%', minHeight: 360, overflow: 'hidden' }}
      media={
        business.cover ? (
          <Box
            component="img"
            src={business.cover}
            alt={`Portada de ${business.name}`}
            sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: 140, backgroundColor: 'surface.badgePill' }} />
        )
      }
      header={
        <Stack direction="row" spacing={1.5} alignItems="center">
          {business.logo ? (
            <Box
              component="img"
              src={business.logo}
              alt={`Logo de ${business.name}`}
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <Box
              aria-hidden
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'surface.badgePill',
                color: 'primary.main',
                fontWeight: 700,
              }}
            >
              {initial}
            </Box>
          )}
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h3" noWrap>
              {business.name}
            </Typography>
            <Badge pill status="neutral">
              {business.category}
            </Badge>
          </Stack>
        </Stack>
      }
    >
      <Stack spacing={1.5}>
        <BusinessDescription
          text={business.description}
          emptyText="Sin descripción por el momento."
        />
        <Typography variant="body2" color="text.secondary" noWrap>
          {business.address ?? 'Ubicación no indicada'}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {hours ?? 'Horario no disponible'}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <MuiButton
            component={Link}
            href={`/${business.slug}`}
            variant="contained"
            color="primary"
            disableElevation
            aria-label={`Ver perfil de ${business.name}`}
          >
            Ver perfil
          </MuiButton>
          <MuiButton
            component={Link}
            href={`/${business.slug}`}
            variant="text"
            color="primary"
            aria-label={`Reservar en ${business.name}`}
          >
            Reservar
          </MuiButton>
        </Stack>
      </Stack>
    </Card>
  );
}
