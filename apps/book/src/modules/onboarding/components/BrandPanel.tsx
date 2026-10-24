'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import { Stack, Typography } from '@foundly/ui';
import { tenantCategoryLabel } from '@foundly/database/categories';
import type { BookingDraft } from '../../../shared/types/tenancy';
import { PILL_SX } from '../../../shared/utils/landingCanon';

const TRUST_POINTS = ['Reservas 24/7', 'Sin tarjeta', 'Configuración guiada'] as const;

/**
 * Left (visual) panel of the onboarding split layout: branding, value copy and
 * a clean, upright preview card that updates live with the business data.
 */
export function BrandPanel({ draft }: { draft: BookingDraft }) {
  const businessName = draft.business?.name?.trim() || 'Tu negocio';
  const slug = draft.business?.slug?.trim() || 'tu-negocio';
  const category = draft.business?.category
    ? tenantCategoryLabel(draft.business.category)
    : 'Tu categoría';
  const duration = draft.setup?.defaultAppointmentDurationMinutes ?? 30;
  const initials =
    businessName
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TN';

  return (
    <Stack spacing={{ xs: 3, md: 3.5 }} sx={{ width: '100%', maxWidth: 520 }}>
      <Stack spacing={1.5}>
        <Typography variant="h3" component="p" sx={{ lineHeight: 1.15 }}>
          Crea tu agenda en minutos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configura tu cuenta, tu negocio y tu primer servicio. Tu página de reservas estará lista
          para compartir en cuanto termines.
        </Typography>
      </Stack>

      <Box sx={{ width: '100%', maxWidth: 380, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.25, px: 0.5 }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: 'success.main',
              boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.success.main, 0.16)}`,
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Vista previa en vivo
          </Typography>
        </Stack>

        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: (theme) =>
              `0 20px 45px ${alpha(theme.palette.primary.main, 0.12)}, ${theme.palette.shadow.card}`,
            overflow: 'hidden',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'primary.light',
                color: 'primary.dark',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {initials}
            </Box>
            <Stack spacing={0.25} sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                {businessName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                foundlylabs.lat/book/{slug}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.35} sx={{ flexShrink: 0 }}>
              <StarIcon sx={{ fontSize: 15, color: 'warning.main' }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                4,9
              </Typography>
            </Stack>
          </Stack>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />

          <Stack spacing={2} sx={{ p: 2.5 }}>
            <Box sx={[PILL_SX, { alignSelf: 'flex-start', py: 0.4 }]}>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 10.5 }} noWrap>
                {category}
              </Typography>
            </Box>

            <Stack spacing={1.25}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Tu primer servicio
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1.5}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.light',
                }}
              >
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                    Servicio principal
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {duration} min · Reserva online
                  </Typography>
                </Stack>
                <CheckCircleIcon sx={{ fontSize: 19, color: 'primary.main', flexShrink: 0 }} />
              </Stack>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Horarios disponibles
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {['09:00', '10:30', '12:00', '16:00'].map((slot, index) => (
                  <Box
                    key={slot}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      py: 0.75,
                      borderRadius: 1.5,
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: index === 1 ? 'primary.main' : 'divider',
                      backgroundColor: index === 1 ? 'primary.light' : 'background.paper',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: index === 1 ? 'primary.dark' : 'text.secondary',
                      }}
                    >
                      {slot}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>

            <Box
              sx={{
                py: 1.1,
                borderRadius: 9999,
                textAlign: 'center',
                backgroundColor: 'primary.main',
                color: 'background.paper',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>
                Reservar cita
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {TRUST_POINTS.map((point) => (
          <Stack key={point} direction="row" alignItems="center" spacing={0.5}>
            <CheckCircleIcon sx={{ fontSize: 15, color: 'primary.main' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {point}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
