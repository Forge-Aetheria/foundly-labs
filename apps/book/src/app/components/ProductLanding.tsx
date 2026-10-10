'use client';

import Image from 'next/image';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import { Badge, Button, Card, Container, Stack, Typography } from '@foundly/ui';
import type { ProductFeature } from '../book-product';
import { GLASS_CARD_SX, PILL_SX, PRIMARY_BUTTON_SX, SECONDARY_BUTTON_SX } from './landingCanon';

export interface ProductLandingProps {
  hero: { title: string; subtitle: string; badge: string };
  cta: { href: string; label: string };
  demo: { href: string; label: string };
  benefits: ProductFeature[];
  industries: readonly string[];
  finalCta: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: { href: string; label: string };
  };
}

/** Product page (public `/book`) — Setmore-inspired structure in Clean Light UI. */
export function ProductLanding({ hero, cta, demo, benefits, industries, finalCta }: ProductLandingProps) {
  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <BrandBar cta={cta} demo={demo} />
      <HeroBand hero={hero} cta={cta} demo={demo} />
      <ShowcaseSection />
      <BenefitsSection benefits={benefits} />
      <IndustriesSection industries={industries} />
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
  cta,
  demo,
}: {
  hero: ProductLandingProps['hero'];
  cta: ProductLandingProps['cta'];
  demo: ProductLandingProps['demo'];
}) {
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

const AGENDA_PREVIEW = [
  { time: '09:00', label: 'Corte y peinado', state: 'Confirmado', tone: 'positive' as const },
  { time: '11:30', label: 'Manicura', state: 'Pendiente', tone: 'warning' as const },
  { time: '13:00', label: 'Asesoría', state: 'Disponible', tone: 'neutral' as const },
];

const PORTAL_PREVIEW = [
  { name: 'Corte y peinado', duration: '30 min' },
  { name: 'Manicura', duration: '45 min' },
  { name: 'Asesoría', duration: '60 min' },
];

function ShowcaseSection() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Card
          sx={GLASS_CARD_SX}
          header={
            <Typography variant="h6" component="h2">
              Tu agenda, siempre al día
            </Typography>
          }
        >
          <Stack spacing={1.5}>
            {AGENDA_PREVIEW.map((row) => (
              <Stack
                key={row.label}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
              >
                <Typography variant="body2">
                  {row.time} · {row.label}
                </Typography>
                <Badge pill status={row.tone}>
                  {row.state}
                </Badge>
              </Stack>
            ))}
          </Stack>
        </Card>

        <Card
          sx={GLASS_CARD_SX}
          header={
            <Typography variant="h6" component="h2">
              Portal público para tus clientes
            </Typography>
          }
        >
          <Stack spacing={1.5}>
            {PORTAL_PREVIEW.map((service) => (
              <Stack key={service.name} direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{service.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {service.duration}
                </Typography>
              </Stack>
            ))}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Badge pill status="positive">
                Reservas abiertas
              </Badge>
              <Typography variant="body2" color="text.secondary">
                estudio-ana
              </Typography>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

function BenefitsSection({ benefits }: { benefits: ProductFeature[] }) {
  return (
    <Container maxWidth="lg" sx={{ pb: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h2">
          Beneficios clave
        </Typography>
        <Stack
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          {benefits.map((benefit) => (
            <Card
              key={benefit.title}
              sx={GLASS_CARD_SX}
              header={
                <Typography variant="h6" component="h3">
                  {benefit.title}
                </Typography>
              }
            >
              <Typography variant="body2" color="text.secondary">
                {benefit.description}
              </Typography>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}

function IndustriesSection({ industries }: { industries: readonly string[] }) {
  return (
    <Container maxWidth="lg" sx={{ pb: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h2">
          Ideal para tu sector
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {industries.map((industry) => (
            <Stack
              key={industry}
              component="span"
              sx={[PILL_SX, { fontSize: 14, fontWeight: 600 }]}
            >
              {industry}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}

function FinalCtaBand({
  finalCta,
}: {
  finalCta: ProductLandingProps['finalCta'];
}) {
  return (
    <Container maxWidth="lg" sx={{ pb: 8 }}>
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