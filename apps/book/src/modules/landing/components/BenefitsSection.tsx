import EventBusyIcon from '@mui/icons-material/EventBusy';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PaymentsIcon from '@mui/icons-material/Payments';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import { Card, Container, Stack, Typography } from '@foundly/ui';
import type { ProductFeature } from '../book-product';
import { GLASS_CARD_SX, PILL_SX } from '../../../shared/utils/landingCanon';

const BENEFIT_ICONS = {
  reminders: NotificationsActiveIcon,
  payments: PaymentsIcon,
  'no-shows': EventBusyIcon,
  integrations: IntegrationInstructionsIcon,
} as const;

/** Benefits grid: enriched lavender icon tiles on elevated glass cards. */
export function BenefitsSection({ benefits }: { benefits: ProductFeature[] }) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      <Stack component="section" spacing={{ xs: 3, md: 4 }}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Stack sx={PILL_SX}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Todo incluido
            </Typography>
          </Stack>
          <Typography variant="h4" component="h2">
            Beneficios clave
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
            Menos trabajo manual y más citas confirmadas: la operación diaria de tu negocio, resuelta.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            alignItems: 'stretch',
          }}
        >
          {benefits.map((benefit) => {
            const Icon = BENEFIT_ICONS[benefit.icon];
            return (
              <Card
                key={benefit.title}
                sx={[
                  GLASS_CARD_SX,
                  {
                    height: '100%',
                    minWidth: 0,
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: (theme) => theme.palette.shadow.fab,
                    },
                  },
                ]}
              >
                <Stack spacing={2}>
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 58,
                      height: 58,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.dark',
                      border: '1px solid',
                      borderColor: 'divider',
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.paper} 100%)`,
                      boxShadow: (theme) =>
                        `inset 0 0 0 6px ${alpha(theme.palette.primary.main, 0.07)}`,
                    }}
                  >
                    <Icon sx={{ fontSize: 30 }} />
                  </Box>

                  <Stack spacing={0.75}>
                    <Typography variant="h6" component="h3">
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {benefit.description}
                    </Typography>
                  </Stack>
                </Stack>
              </Card>
            );
          })}
        </Box>
      </Stack>
    </Container>
  );
}
