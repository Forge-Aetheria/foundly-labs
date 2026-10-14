'use client';

import Box from '@mui/material/Box';
import { Typography } from '@foundly/ui';

export interface CoverBannerProps {
  cover: string | null;
  name: string;
  /** Fallback image (e.g. the first gallery photo) used when no cover is set (feature 021). */
  fallback?: string | null;
}

/**
 * Contained, rounded hero banner for the business cover (feature 003, amended).
 * Resolution order (021 FR-005): saved cover → first gallery photo → branded gradient
 * containing the business name, so the hero is never empty.
 *
 * The banner is rendered inside the page container (lateral margins) with a capped
 * height and `object-fit: cover`; the info card of the two-column layout overlaps its
 * lower edge on desktop (see `PublicPortal`).
 */
export function CoverBanner({ cover, name, fallback = null }: CoverBannerProps) {
  const hero = cover?.trim() || fallback?.trim() || null;
  const frameSx = {
    display: 'block',
    width: '100%',
    height: { xs: 200, md: 340 },
    borderRadius: 2,
    overflow: 'hidden',
  } as const;

  if (hero) {
    return (
      <Box
        component="img"
        data-testid="portal-hero"
        src={hero}
        alt={`Portada de ${name}`}
        sx={{ ...frameSx, objectFit: 'cover' }}
      />
    );
  }
  return (
    <Box
      data-testid="portal-hero"
      role="img"
      aria-label={`Portada de ${name}`}
      sx={{
        ...frameSx,
        display: 'flex',
        alignItems: 'flex-end',
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 3 },
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      }}
    >
      <Typography variant="h4" component="p" sx={{ color: 'primary.contrastText', fontWeight: 700 }}>
        {name}
      </Typography>
    </Box>
  );
}
