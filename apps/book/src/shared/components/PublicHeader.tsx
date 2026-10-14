'use client';

import Image from 'next/image';
import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import { Button, Stack } from '@foundly/ui';
import { PRIMARY_BUTTON_SX } from '../utils/landingCanon';

export interface PublicHeaderProps {
  /** Primary call to action (defaults to the onboarding entry). */
  cta?: { href: string; label: string };
}

const DEFAULT_CTA = { href: '/onboarding', label: 'Registrar mi negocio' };

const NAV_ITEMS = [
  { href: '/negocios', label: 'Negocios' },
  { href: '/#precios', label: 'Precios' },
  { href: '/login', label: 'Iniciar sesión' },
] as const;

/** Neutral, borderless link styling that neutralizes the native visited/link colors. */
const NAV_LINK_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  px: 1.5,
  py: 1,
  borderRadius: 1,
  color: 'text.secondary',
  textDecoration: 'none',
  '&:visited': { color: 'text.secondary' },
  '&:hover': { color: 'primary.main', backgroundColor: 'surface.badgePill' },
};

/**
 * Global public header (landing + directory): transparent so it blends with the page
 * background, with modern borderless nav (`Negocios`, `Precios`, `Iniciar sesión`) and
 * the primary `Registrar mi negocio` CTA. Shared so `/negocios` keeps the landing chrome.
 */
export function PublicHeader({ cta = DEFAULT_CTA }: PublicHeaderProps) {
  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: { xs: 2, md: 3 }, py: 1.5, backgroundColor: 'transparent' }}
    >
      <Link href="/" aria-label="Foundly Book — inicio" style={{ display: 'flex' }}>
        <Image src="/branding-logo.png" alt="Foundly Book" width={140} height={70} priority />
      </Link>
      <Stack direction="row" spacing={0.5} alignItems="center">
        {NAV_ITEMS.map((item) => (
          <MuiLink
            key={item.href}
            component={Link}
            href={item.href}
            underline="none"
            sx={NAV_LINK_SX}
          >
            {item.label}
          </MuiLink>
        ))}
        <Link href={cta.href} style={{ marginLeft: 8 }}>
          <Button variant="primary" sx={PRIMARY_BUTTON_SX}>
            {cta.label}
          </Button>
        </Link>
      </Stack>
    </Stack>
  );
}
