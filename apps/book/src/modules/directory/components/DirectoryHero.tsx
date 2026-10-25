import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import { Container, Stack, Typography } from '@foundly/ui';

const HERO_VIDEOS = [
  '/videos/video1.mp4',
  '/videos/video2.mp4',
  '/videos/video3.mp4',
  '/videos/video4.mp4',
] as const;

/**
 * Directory hero: four looping clips side by side (no sector tags) with the
 * page title and subtitle overlaid on top of the video band.
 */
export function DirectoryHero() {
  return (
    <Box component="section" sx={{ pt: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Container maxWidth="lg" disableGutters>
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: { xs: 2.5, md: 3 },
            backgroundColor: 'text.primary',
            boxShadow: (theme) => theme.palette.shadow.card,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(4, minmax(0, 1fr))',
              },
              gap: { xs: 0.75, sm: 1.25 },
              p: { xs: 0.75, sm: 1.25 },
            }}
          >
            {HERO_VIDEOS.map((src) => (
              <Box
                key={src}
                component="video"
                aria-hidden="true"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                sx={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  aspectRatio: { xs: '3 / 4', sm: '4 / 5' },
                  objectFit: 'cover',
                  borderRadius: 1.5,
                }}
              >
                <source src={src} type="video/mp4" />
              </Box>
            ))}
          </Box>

          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              background: (theme) =>
                `linear-gradient(180deg, ${alpha(theme.palette.text.primary, 0.55)} 0%, ${alpha(
                  theme.palette.text.primary,
                  0.35,
                )} 55%, ${alpha(theme.palette.text.primary, 0.65)} 100%)`,
            }}
          />

          <Stack
            spacing={1.25}
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: { xs: 3, sm: 5 },
              color: 'common.white',
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                color: 'common.white',
                textShadow: '0 2px 16px rgba(15, 23, 42, 0.45)',
              }}
            >
              Negocios
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'common.white',
                opacity: 0.9,
                maxWidth: 560,
                textShadow: '0 1px 10px rgba(15, 23, 42, 0.4)',
              }}
            >
              Descubre negocios, compara servicios y reserva tu cita en segundos.
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
