import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageIcon from '@mui/icons-material/Language';
import LinkIcon from '@mui/icons-material/Link';
import StarIcon from '@mui/icons-material/Star';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { Container, Stack, Typography } from '@foundly/ui';
import type { ProductStep } from '../book-product';

const SHARE_TARGETS = [
  { label: 'WhatsApp', icon: WhatsAppIcon, background: 'success.light', color: 'success.main' },
  { label: 'Instagram', icon: InstagramIcon, background: 'primary.light', color: 'primary.main' },
  { label: 'Web', icon: LanguageIcon, background: 'info.light', color: 'info.main' },
] as const;

/**
 * "3 pasos para el éxito": Setmore-style process. Each column pairs the plain
 * numbered copy with its UI preview below — no badges or wrapping text cards.
 */
export function ProcessStepsSection({ steps }: { steps: ProductStep[] }) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      <Stack component="section" spacing={{ xs: 4, md: 5 }}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Typography variant="h4" component="h2">
            3 pasos para el éxito 🏆
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 580 }}>
            Crea tu página, personalízala con tu marca y compártela para empezar a recibir reservas
            24/7.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 4 },
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' },
            alignItems: 'stretch',
          }}
        >
          {steps.map((step, index) => (
            <Stack key={step.step} spacing={2.5} sx={{ minWidth: 0 }}>
              <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                <Typography variant="h6" component="h3">
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </Stack>

              <PreviewCard>
                <StepPreview index={index} />
              </PreviewCard>
            </Stack>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}

function PreviewCard({ children }: { children: ReactNode }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        flexGrow: 1,
        minHeight: 168,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        boxShadow: (theme) => theme.palette.shadow.card,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.palette.shadow.fab,
        },
      }}
    >
      {children}
    </Box>
  );
}

function StepPreview({ index }: { index: number }) {
  if (index === 0) {
    return <CreatePagePreview />;
  }
  if (index === 1) {
    return <BrandPreview />;
  }
  return <SharePreview />;
}

function CreatePagePreview() {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'primary.light',
            color: 'primary.main',
          }}
        >
          <LinkIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            px: 1.25,
            py: 0.75,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: 11, display: 'block', color: 'text.secondary' }}
            noWrap
          >
            foundlylabs.lat/
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'primary.main', fontSize: 11 }}
            noWrap
          >
            tu-negocio
          </Typography>
        </Box>
        <ContentCopyIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
        {['Reservas 24/7', 'Sin código', 'Tu marca'].map((label) => (
          <Box
            key={label}
            sx={{
              px: 1,
              py: 0.35,
              borderRadius: '9999px',
              backgroundColor: 'surface.badgePill',
              color: 'text.secondary',
            }}
          >
            <Typography variant="caption" sx={{ fontSize: 9.5, fontWeight: 600 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

function BrandPreview() {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 15,
            color: 'background.paper',
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.brand.book} 100%)`,
            boxShadow: (theme) => `0 8px 18px ${alpha(theme.palette.primary.main, 0.25)}`,
          }}
        >
          EL
        </Box>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
            Estudio Luna
          </Typography>
          <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
            Belleza · Madrid
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Stack direction="row" spacing={0.15}>
          {[0, 1, 2, 3, 4].map((star) => (
            <StarIcon key={star} sx={{ fontSize: 14, color: 'warning.main' }} />
          ))}
        </Stack>
        <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
          4,9 · 128 reseñas
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.75}>
        {['Corte', 'Manicura', 'Color'].map((service) => (
          <Box
            key={service}
            sx={{ px: 1, py: 0.4, borderRadius: 1, backgroundColor: 'surface.badgePill' }}
          >
            <Typography variant="caption" sx={{ fontSize: 9.5, fontWeight: 600 }}>
              {service}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

function SharePreview() {
  return (
    <Stack spacing={2} alignItems="center">
      <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="center">
        {SHARE_TARGETS.map(({ label, icon: Icon, background, color }) => (
          <Stack key={label} spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: background,
                color,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="caption" sx={{ fontSize: 9.5, color: 'text.secondary' }}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" alignItems="center" spacing={0.5}>
        <CheckIcon sx={{ fontSize: 13, color: 'success.main' }} />
        <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
          Comparte tu enlace o QR
        </Typography>
      </Stack>
    </Stack>
  );
}
