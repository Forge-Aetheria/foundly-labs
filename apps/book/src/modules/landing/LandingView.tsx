'use client';

import Link from 'next/link';
import CheckIcon from '@mui/icons-material/Check';
import { Button, Card, Container, Stack, Typography } from '@foundly/ui';
import type {
  ProductFeature,
  ProductIndustry,
  ProductPricingPlan,
  ProductSpotlight,
  ProductStep,
} from './book-product';
import {
  GLASS_CARD_SX,
  PILL_SX,
  PRIMARY_BUTTON_SX,
  SECONDARY_BUTTON_SX,
} from '../../shared/utils/landingCanon';
import { PublicHeader } from '../../shared/components/PublicHeader';
import { PublicFooter } from '../../shared/components/PublicFooter';
import { HeroBand } from './components/HeroBand';
import { ProcessStepsSection } from './components/ProcessStepsSection';
import { BenefitsSection } from './components/BenefitsSection';
import { IndustriesSection } from './components/IndustriesSection';

export interface ProductLandingProps {
  hero: { title: string; subtitle: string; badge: string };
  /** Fast email-capture row in the hero. */
  heroCapture: { placeholder: string; button: string };
  cta: { href: string; label: string };
  spotlight: ProductSpotlight;
  steps: ProductStep[];
  benefits: ProductFeature[];
  industries: readonly ProductIndustry[];
  pricing: ProductPricingPlan[];
  finalCta: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: { href: string; label: string };
  };
}

/** Landing view (public `/book`) — Setmore-inspired conversion funnel in Clean Light UI. */
export function LandingView({
  hero,
  heroCapture,
  cta,
  spotlight,
  steps,
  benefits,
  industries,
  pricing,
  finalCta,
}: ProductLandingProps) {
  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <PublicHeader cta={cta} />
      <HeroBand hero={hero} heroCapture={heroCapture} cta={cta} />
      <SpotlightSection spotlight={spotlight} />
      <ProcessStepsSection steps={steps} />
      <BenefitsSection benefits={benefits} />
      <IndustriesSection industries={industries} />
      <PricingSection pricing={pricing} />
      <FinalCtaBand finalCta={finalCta} />
      <PublicFooter />
    </Stack>
  );
}

/** Showcase / spotlight: featured block with a preview of a booking page. */
function SpotlightSection({ spotlight }: { spotlight: ProductSpotlight }) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={GLASS_CARD_SX}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
          <Stack spacing={1.5} sx={{ flex: 1 }}>
            <Typography variant="overline" color="text.secondary">
              {spotlight.eyebrow}
            </Typography>
            <Typography variant="h3" component="h2">
              {spotlight.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {spotlight.description}
            </Typography>
            {spotlight.cta ? (
              <Link href={spotlight.cta.href}>
                <Button variant="primary" sx={PRIMARY_BUTTON_SX}>
                  {spotlight.cta.label}
                </Button>
              </Link>
            ) : null}
          </Stack>
          <BookingPreview preview={spotlight.preview} />
        </Stack>
      </Card>
    </Container>
  );
}

function BookingPreview({ preview }: { preview: ProductSpotlight['preview'] }) {
  return (
    <Stack
      sx={{
        flex: 1,
        width: '100%',
        maxWidth: 480,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'var(--book-glass-card)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Fake browser chrome */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Stack direction="row" spacing={0.5}>
          <Stack
            sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'error.main' }}
          />
          <Stack
            sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'warning.main' }}
          />
          <Stack
            sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'success.main' }}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary" noWrap>
          tu-negocio.foundlylabs.lat/book/{preview.name.toLowerCase().replace(/\s+/g, '-')}
        </Typography>
      </Stack>

      <Stack sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h3" noWrap>
              {preview.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {preview.tagline}
            </Typography>
          </Stack>
          <Stack sx={PILL_SX}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
              ★ {preview.rating}
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
          {preview.services.map((service) => (
            <Stack
              key={service.name}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ borderBottom: 1, borderColor: 'divider', pb: 0.75 }}
            >
              <Typography variant="body2">{service.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {service.meta}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mt: 1.5 }}>
          {preview.slots.map((slot) => (
            <Stack
              key={slot}
              sx={{
                ...SECONDARY_BUTTON_SX,
                px: 1.5,
                py: 0.5,
                borderRadius: '9999px',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {slot}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Stack
          sx={{
            mt: 1.5,
            backgroundColor: 'primary.main',
            color: 'background.paper',
            borderRadius: '9999px',
            px: 2,
            py: 1.25,
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Reservar
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

function PricingSection({ pricing }: { pricing: ProductPricingPlan[] }) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack component="section" id="precios" spacing={2} sx={{ scrollMarginTop: { xs: 88, md: 96 } }}>
        <Typography variant="h4" component="h2">
          Precios sencillos
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2 }}>
          {pricing.map((plan) => (
            <Card
              key={plan.id}
              sx={[
                GLASS_CARD_SX,
                plan.highlighted ? { borderColor: 'primary.main', borderWidth: 2 } : {},
                { flex: 1 },
              ]}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="h6" component="h3">
                    {plan.name}
                  </Typography>
                  {plan.highlighted ? (
                    <Stack sx={[PILL_SX, { py: 0.25, px: 1 }]}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Popular
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>
                <Stack direction="row" alignItems="baseline" spacing={0.5}>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {plan.price}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {plan.period}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {plan.description}
                </Typography>
                <Stack spacing={0.5}>
                  {plan.features.map((feature) => (
                    <Stack key={feature} direction="row" spacing={1} alignItems="center">
                      <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2">{feature}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Link href={plan.cta.href}>
                  <Button
                    variant={plan.highlighted ? 'primary' : 'secondary'}
                    sx={plan.highlighted ? PRIMARY_BUTTON_SX : SECONDARY_BUTTON_SX}
                    fullWidth
                  >
                    {plan.cta.label}
                  </Button>
                </Link>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}

function FinalCtaBand({ finalCta }: { finalCta: ProductLandingProps['finalCta'] }) {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.paper} 100%)`,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          p: { xs: 3, md: 5 },
        }}
      >
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="overline" color="text.secondary">
            {finalCta.eyebrow}
          </Typography>
          <Typography variant="h4" component="h2">
            {finalCta.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {finalCta.subtitle}
          </Typography>
          <Link href={finalCta.cta.href}>
            <Button variant="primary" sx={PRIMARY_BUTTON_SX}>
              {finalCta.cta.label}
            </Button>
          </Link>
        </Stack>
      </Stack>
    </Container>
  );
}
