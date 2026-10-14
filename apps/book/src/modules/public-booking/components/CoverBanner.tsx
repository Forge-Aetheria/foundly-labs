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
 * Full-width hero banner for the business cover, below the header and above the profile.
 * Resolution order (021 FR-005): saved cover → first gallery photo → branded gradient
 * containing the business name, so the hero is never empty.
 */
export function CoverBanner({ cover, name, fallback = null }: CoverBannerProps) {
  const hero = cover?.trim() || fallback?.trim() || null;
  if (hero) {
    return (
      <Box
        component="img"
        src={hero}
        alt={`Portada de ${name}`}
        sx={{
          display: 'block',
          width: '100%',
          height: { xs: 200, md: 360 },
          objectFit: 'cover',
        }}
      />
    );
  }
  return (
    <Box
      role="img"
      aria-label={`Portada de ${name}`}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        width: '100%',
        height: { xs: 200, md: 360 },
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
