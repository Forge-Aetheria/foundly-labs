import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { Badge, Card, Chip, Stack, Typography } from '@foundly/ui';
import { BusinessDescription } from './BusinessDescription';
import { formatDirectoryHours } from '../utils/hours';
import type { DirectoryBusiness } from '../utils/types';

export interface BusinessCardProps {
  business: DirectoryBusiness;
}

/**
 * Public directory card (feature 019): cover banner, overlapping logo/avatar,
 * identity, location, hours, availability badge and the two clear actions.
 */
export function BusinessCard({ business }: BusinessCardProps) {
  const hours = formatDirectoryHours(business.hours);
  const initial = business.name.trim().charAt(0).toUpperCase() || '?';
  const profileHref = `/${business.slug}`;

  return (
    <Card
      sx={{
        width: '100%',
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.palette.shadow.fab,
        },
        // Let the card body grow so the action row always sits at the bottom.
        '& > .MuiBox-root:last-child': {
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          p: 2.5,
        },
      }}
      media={
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 160,
            flexShrink: 0,
            overflow: 'hidden',
            background: (theme) =>
              business.cover
                ? theme.palette.surface.badgePill
                : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.surface.badgePill} 100%)`,
          }}
        >
          {business.cover ? (
            <Box
              component="img"
              src={business.cover}
              alt={`Portada de ${business.name}`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
              <StorefrontOutlinedIcon
                sx={{
                  fontSize: 44,
                  color: (theme) => alpha(theme.palette.primary.main, 0.35),
                }}
              />
            </Stack>
          )}

          {/* Legibility overlay for the status badge */}
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              background: (theme) =>
                `linear-gradient(180deg, ${alpha(theme.palette.text.primary, 0.08)} 0%, transparent 45%, ${alpha(theme.palette.text.primary, 0.18)} 100%)`,
            }}
          />

          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <Badge pill status="positive" icon={<EventAvailableIcon sx={{ fontSize: 14 }} />}>
              Reservas online
            </Badge>
          </Box>
        </Box>
      }
    >
      <Stack spacing={1.75} sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ mt: -6 }}>
          {business.logo ? (
            <Box
              component="img"
              src={business.logo}
              alt={`Logo de ${business.name}`}
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: '3px solid',
                borderColor: 'background.paper',
                backgroundColor: 'background.paper',
                boxShadow: (theme) => theme.palette.shadow.card,
              }}
            />
          ) : (
            <Box
              aria-hidden
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid',
                borderColor: 'background.paper',
                backgroundColor: 'primary.light',
                color: 'primary.main',
                fontWeight: 700,
                fontSize: 24,
                boxShadow: (theme) => theme.palette.shadow.card,
              }}
            >
              {initial}
            </Box>
          )}

          <Stack spacing={0.5} sx={{ minWidth: 0, pb: 0.5 }}>
            <Typography variant="h6" component="h3" noWrap>
              {business.name}
            </Typography>
            <Badge pill status="neutral">
              {business.category}
            </Badge>
          </Stack>
        </Stack>

        <BusinessDescription
          text={business.description}
          emptyText="Sin descripción por el momento."
        />

        {business.tags.length > 0 ? (
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {business.tags.slice(0, 4).map((tag) => (
              <Chip key={tag} label={tag} color="primary" />
            ))}
          </Stack>
        ) : null}

        <Stack spacing={0.75}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
            <LocationOnOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
              {business.address ?? 'Ubicación no indicada'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
            <ScheduleOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
              {hours ?? 'Horario no disponible'}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 1, alignItems: 'stretch' }}>
          <MuiButton
            component={Link}
            href={profileHref}
            variant="outlined"
            disableElevation
            fullWidth
            aria-label={`Ver perfil de ${business.name}`}
            sx={{
              borderRadius: 9999,
              flex: '1 1 0',
              minWidth: 0,
              px: 1.5,
              whiteSpace: 'nowrap',
            }}
          >
            Ver perfil
          </MuiButton>
          <MuiButton
            component={Link}
            href={profileHref}
            variant="contained"
            color="primary"
            disableElevation
            fullWidth
            aria-label={`Reservar en ${business.name}`}
            sx={{
              borderRadius: 9999,
              flex: '1 1 0',
              minWidth: 0,
              px: 1.5,
              whiteSpace: 'nowrap',
            }}
          >
            Reservar cita
          </MuiButton>
        </Stack>
      </Stack>
    </Card>
  );
}
