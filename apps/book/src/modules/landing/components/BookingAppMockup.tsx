import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import { Stack, Typography } from '@foundly/ui';

const SERVICES = [
  { name: 'Corte + lavado', meta: '30 min · 20 €', selected: true },
  { name: 'Color y mechas', meta: '60 min · 35 €', selected: false },
] as const;

const DAYS = [
  { label: 'LUN', day: '20', selected: false },
  { label: 'MAR', day: '21', selected: true },
  { label: 'MIÉ', day: '22', selected: false },
  { label: 'JUE', day: '23', selected: false },
] as const;

const SLOTS = ['09:00', '10:30', '12:00', '16:00'] as const;

/**
 * Floating product mockup for the hero: a phone showing the real Foundly Book
 * booking flow (service → day → slot → confirm) with notification cards layered
 * around it. Purely presentational — `role="img"` keeps the preview out of the
 * reading order while the label describes it.
 */
export function BookingAppMockup() {
  return (
    <Box
      role="img"
      aria-label="Vista previa de la app de reservas Foundly Book: selección de servicio, día y hora, con confirmación de reserva y recordatorio automático"
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 460,
        mx: 'auto',
        px: { xs: 1, sm: 2 },
        py: { xs: 4, md: 2 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Lavender halo behind the phone */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: '8% 4%',
          borderRadius: '50%',
          background: (theme) =>
            `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.32)} 0%, ${alpha(
              theme.palette.primary.main,
              0.08,
            )} 55%, transparent 72%)`,
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          position: 'relative',
          width: { xs: 262, sm: 300, md: 316 },
          borderRadius: '46px',
          p: '9px',
          background: (theme) =>
            `linear-gradient(155deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: (theme) =>
            `0 42px 90px ${alpha(theme.palette.primary.main, 0.34)}, 0 20px 44px ${alpha(
              theme.palette.text.primary,
              0.24,
            )}`,
          transform: 'rotate(-4deg)',
          transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
          animation: 'foundly-hero-float 8s ease-in-out infinite',
          '@keyframes foundly-hero-float': {
            '0%, 100%': { translate: '0 0' },
            '50%': { translate: '0 -10px' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          '&:hover': { transform: 'rotate(-2deg) translateY(-6px)' },
        }}
      >
        {/* Phone screen */}
        <Box
          sx={{
            borderRadius: '38px',
            overflow: 'hidden',
            backgroundColor: 'background.paper',
            minHeight: 548,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Status bar */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10 }}>
              9:41
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 14, height: 7, borderRadius: 1, backgroundColor: 'text.primary' }} />
              <Box sx={{ width: 18, height: 8, borderRadius: 1, backgroundColor: 'text.primary' }} />
            </Stack>
          </Stack>

          {/* App header */}
          <Box
            sx={{
              mx: 1.5,
              mt: 1,
              borderRadius: 3,
              p: 1.75,
              color: 'background.paper',
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.brand.book} 100%)`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: (theme) => alpha(theme.palette.common.white, 0.22),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                EA
              </Box>
              <Stack sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                  Estudio Ana
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.85, fontSize: 10, display: 'block' }}
                  noWrap
                >
                  Peluquería · Madrid
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Stack spacing={1.25} sx={{ p: 1.75, flexGrow: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Elige un servicio
            </Typography>

            <Stack spacing={0.75}>
              {SERVICES.map((service) => (
                <Stack
                  key={service.name}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 1.25,
                    py: 1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: service.selected ? 'primary.main' : 'divider',
                    backgroundColor: service.selected ? 'primary.light' : 'background.paper',
                  }}
                >
                  <Stack sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, fontSize: 11 }}
                      noWrap
                    >
                      {service.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontSize: 9.5 }}
                      noWrap
                    >
                      {service.meta}
                    </Typography>
                  </Stack>
                  {service.selected ? (
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  ) : null}
                </Stack>
              ))}
            </Stack>

            <Stack spacing={0.75} sx={{ mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Marzo 2025
              </Typography>
              <Stack direction="row" spacing={0.5} justifyContent="space-between">
                {DAYS.map((day) => (
                  <Stack
                    key={day.day}
                    spacing={0.25}
                    alignItems="center"
                    sx={{
                      flex: 1,
                      py: 0.75,
                      borderRadius: 2,
                      backgroundColor: day.selected ? 'primary.main' : 'surface.badgePill',
                      color: day.selected ? 'background.paper' : 'text.secondary',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: 8, fontWeight: 700 }}>
                      {day.label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: 12, fontWeight: 700 }}>
                      {day.day}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <Stack spacing={0.75} sx={{ mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Horarios disponibles
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
                {SLOTS.map((slot) => (
                  <Box
                    key={slot}
                    sx={{
                      py: 0.75,
                      borderRadius: 1.5,
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: slot === '10:30' ? 'primary.main' : 'divider',
                      backgroundColor: slot === '10:30' ? 'primary.light' : 'background.paper',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: slot === '10:30' ? 'primary.dark' : 'text.secondary',
                      }}
                    >
                      {slot}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>

            <Box
              sx={{
                mt: 'auto',
                py: 1.25,
                borderRadius: 9999,
                textAlign: 'center',
                backgroundColor: 'primary.main',
                color: 'background.paper',
                boxShadow: (theme) => `0 10px 22px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>
                Confirmar reserva · 10:30
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Floating: booking confirmed */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          position: 'absolute',
          top: { xs: 12, sm: 34, md: 46 },
          right: { xs: 0, sm: -8, md: -18 },
          zIndex: 2,
          minWidth: 196,
          px: 1.5,
          py: 1.25,
          borderRadius: 2.5,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) => `0 18px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
          transform: 'rotate(4deg)',
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'success.light',
            color: 'success.main',
            flexShrink: 0,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 18 }} />
        </Box>
        <Stack spacing={0.15} sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }} noWrap>
            Reserva confirmada
          </Typography>
          <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
            Hoy · 10:30 · Laura M.
          </Typography>
        </Stack>
      </Stack>

      {/* Floating: reminder sent */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          position: 'absolute',
          bottom: { xs: 16, sm: 42, md: 54 },
          left: { xs: 0, sm: -8, md: -18 },
          zIndex: 2,
          display: { xs: 'none', sm: 'flex' },
          px: 1.5,
          py: 1.1,
          borderRadius: 2.5,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) => `0 18px 40px ${alpha(theme.palette.text.primary, 0.12)}`,
          transform: 'rotate(-3deg)',
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'primary.light',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: 17 }} />
        </Box>
        <Stack spacing={0.15} sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }} noWrap>
            Recordatorio enviado
          </Typography>
          <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
            24 h antes · Email + SMS
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
