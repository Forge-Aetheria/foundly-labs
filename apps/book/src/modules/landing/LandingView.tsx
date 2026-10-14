'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PaymentsIcon from '@mui/icons-material/Payments';
import { Button, Card, Container, Stack, TextField, Typography } from '@foundly/ui';
import type {
  ProductFeature,
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

const BENEFIT_ICONS = {
  reminders: NotificationsActiveIcon,
  payments: PaymentsIcon,
  'no-shows': EventBusyIcon,
  integrations: IntegrationInstructionsIcon,
} as const;

export interface ProductLandingProps {
  hero: { title: string; subtitle: string; badge: string };
  /** Fast email-capture row in the hero. */
  heroCapture: { placeholder: string; button: string };
  cta: { href: string; label: string };
  demo: { href: string; label: string };
  spotlight: ProductSpotlight;
  steps: ProductStep[];
  benefits: ProductFeature[];
  industries: readonly string[];
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
  demo,
  spotlight,
  steps,
  benefits,
  industries,
  pricing,
  finalCta,
}: ProductLandingProps) {
  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <BrandBar cta={cta} demo={demo} />
      <HeroBand hero={hero} heroCapture={heroCapture} cta={cta} demo={demo} />
      <SpotlightSection spotlight={spotlight} />
      <StepsSection steps={steps} />
      <BenefitsSection benefits={benefits} />
      <IndustriesSection industries={industries} />
      <PricingSection pricing={pricing} />
      <FinalCtaBand finalCta={finalCta} />
    </Stack>
  );
}

function BrandBar({
  cta,
  demo,
}: {
  cta: ProductLandingProps['cta'];
  demo: ProductLandingProps['demo'];
}) {
  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        px: 3,
        py: 1.5,
        backgroundColor: 'var(--book-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: 1,
        borderColor: (theme) => alpha(theme.palette.border.subtle, 0.6),
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Link href="/" aria-label="Foundly Book — inicio" style={{ display: 'flex' }}>
        <Image src="/branding-logo.png" alt="Foundly Book" width={140} height={70} priority />
      </Link>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography
          variant="button"
          color="text.secondary"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          <Link href="/directorio" style={{ textDecoration: 'none' }}>
            Directorio
          </Link>
        </Typography>
        <Typography
          variant="button"
          color="text.secondary"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          <Link href={demo.href} style={{ textDecoration: 'none' }}>
            {demo.label}
          </Link>
        </Typography>
        <Link href={cta.href}>
          <Button variant="primary" sx={PRIMARY_BUTTON_SX}>
            {cta.label}
          </Button>
        </Link>
      </Stack>
    </Stack>
  );
}

function HeroBand({
  hero,
  heroCapture,
  cta,
  demo,
}: {
  hero: ProductLandingProps['hero'];
  heroCapture: ProductLandingProps['heroCapture'];
  cta: ProductLandingProps['cta'];
  demo: ProductLandingProps['demo'];
}) {
  const [email, setEmail] = useState('');

  return (
    <Stack
      sx={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Foundly "F" isotipo watermark (low opacity, mirrors the landing hero) */}
      <Stack
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
          opacity: 0.22,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      >
        <Image src="/icon.png" alt="" width={720} height={720} priority />
      </Stack>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 12 }, position: 'relative', zIndex: 1 }}>
        <Stack spacing={3} sx={{ maxWidth: 780 }}>
          <Stack sx={[PILL_SX, { alignSelf: 'flex-start' }]}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {hero.badge}
            </Typography>
          </Stack>
          <Typography variant="h1">{hero.title}</Typography>
          <Typography
            variant="h5"
            component="p"
            color="text.secondary"
            sx={{ fontWeight: 400, lineHeight: 1.55 }}
          >
            {hero.subtitle}
          </Typography>

          {/* Fast email capture */}
          <Stack
            component="form"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ maxWidth: 560 }}
            onSubmit={(event) => {
              event.preventDefault();
              window.location.href = '/onboarding';
            }}
          >
            <TextField
              label={heroCapture.placeholder}
              type="email"
              value={email}
              onChange={setEmail}
              sx={{ flex: 1 }}
            />
            <Button variant="primary" type="submit" sx={PRIMARY_BUTTON_SX}>
              {heroCapture.button}
            </Button>
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
            <Link href={cta.href}>
              <Button variant="primary" sx={PRIMARY_BUTTON_SX}>
                {cta.label}
              </Button>
            </Link>
            <Link href={demo.href}>
              <Button variant="secondary" sx={SECONDARY_BUTTON_SX}>
                {demo.label}
              </Button>
            </Link>
          </Stack>
        </Stack>
      </Container>
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
            <Link href={spotlight.cta.href}>
              <Button variant="primary" sx={PRIMARY_BUTTON_SX}>
                {spotlight.cta.label}
              </Button>
            </Link>
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

function StepsSection({ steps }: { steps: ProductStep[] }) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack component="section" spacing={2}>
        <Typography variant="h4" component="h2">
          Empieza en 3 pasos
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2 }}>
          {steps.map((step) => (
            <Card key={step.step} sx={[GLASS_CARD_SX, { flex: 1 }]}>
              <Stack spacing={1}>
                <Stack
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'background.paper',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {step.step}
                  </Typography>
                </Stack>
                <Typography variant="h6" component="h3">
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}

function BenefitsSection({ benefits }: { benefits: ProductFeature[] }) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack component="section" spacing={2}>
        <Typography variant="h4" component="h2">
          Beneficios clave
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
          {benefits.map((benefit) => {
            const Icon = BENEFIT_ICONS[benefit.icon];
            return (
              <Card
                key={benefit.title}
                sx={[GLASS_CARD_SX, { flex: { xs: '1 1 100%', md: '1 1 calc(25% - 16px)' } }]}
              >
                <Stack spacing={1}>
                  <Stack
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      backgroundColor: 'surface.badgePill',
                      color: 'primary.main',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon fontSize="small" />
                  </Stack>
                  <Typography variant="h6" component="h3">
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Stack>
    </Container>
  );
}

function IndustriesSection({ industries }: { industries: readonly string[] }) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack component="section" spacing={2}>
        <Typography variant="h4" component="h2">
          Ideal para tu sector
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {industries.map((industry) => (
            <Stack key={industry} component="span" sx={PILL_SX}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {industry}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}

function PricingSection({ pricing }: { pricing: ProductPricingPlan[] }) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack component="section" spacing={2}>
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
