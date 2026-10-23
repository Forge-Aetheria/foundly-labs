import Link from 'next/link';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import { alpha } from '@mui/material/styles';
import { Container, Stack, Typography } from '@foundly/ui';
import type { ProductIndustry } from '../book-product';
import { PILL_SX } from '../../../shared/utils/landingCanon';

/**
 * Sector showcase: four video-backed cards. Each clip auto-plays muted on a
 * loop behind a subtle dark overlay so the white sector title stays legible.
 */
export function IndustriesSection({ industries }: { industries: readonly ProductIndustry[] }) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      <Stack component="section" spacing={{ xs: 3, md: 4 }}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Stack sx={PILL_SX}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Para cualquier negocio
            </Typography>
          </Stack>
          <Typography variant="h4" component="h2">
            Ideal para tu sector
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 540 }}>
            Descubre cómo negocios reales llenan su agenda con Foundly Book.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            alignItems: 'stretch',
          }}
        >
          {industries.map((industry) => (
            <MuiLink
              key={industry.id}
              component={Link}
              href={`/negocios?q=${encodeURIComponent(industry.searchQuery)}`}
              underline="none"
              aria-label={`Ver negocios de ${industry.title}`}
              sx={{
                position: 'relative',
                display: 'block',
                overflow: 'hidden',
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                aspectRatio: { xs: '16 / 10', sm: '4 / 5' },
                backgroundColor: 'text.primary',
                boxShadow: (theme) => theme.palette.shadow.card,
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: (theme) => theme.palette.shadow.fab,
                },
                '&:hover video': { transform: 'scale(1.05)' },
                '&:visited': { color: 'common.white' },
              }}
            >
              <Box
                component="video"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 600ms ease',
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                  },
                }}
              >
                <source src={industry.video} type="video/mp4" />
              </Box>

              <Box
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.45),
                  backdropFilter: 'blur(1px)',
                  WebkitBackdropFilter: 'blur(1px)',
                }}
              />

              <Stack
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  height: '100%',
                  justifyContent: 'flex-end',
                  p: { xs: 2, sm: 2.5 },
                  color: 'common.white',
                }}
                spacing={0.75}
              >
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ color: 'common.white', textShadow: '0 1px 8px rgba(15, 23, 42, 0.35)' }}
                >
                  {industry.title}
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography
                    variant="caption"
                    sx={{ color: 'common.white', opacity: 0.85, fontWeight: 600 }}
                  >
                    Ver sector
                  </Typography>
                  <ArrowOutwardIcon sx={{ fontSize: 18, color: 'common.white', opacity: 0.9 }} />
                </Stack>
              </Stack>
            </MuiLink>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}
