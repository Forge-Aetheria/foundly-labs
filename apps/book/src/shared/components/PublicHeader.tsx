'use client';

import Image from 'next/image';
import Link from 'next/link';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import { Button, Stack } from '@foundly/ui';
import { PRIMARY_BUTTON_SX, SECONDARY_BUTTON_SX } from '../utils/landingCanon';

export interface PublicHeaderProps {
  /** Primary call to action (defaults to the onboarding entry). */
  cta?: { href: string; label: string };
}

const DEFAULT_CTA = { href: '/onboarding', label: 'Registrar mi negocio' };

const NAV_ITEMS = [
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

/** Secondary "search businesses" affordance: the directory entry that used to live in the hero. */
const SEARCH_LINK_SX = {
  ...SECONDARY_BUTTON_SX,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  px: 2,
  py: 1,
  borderRadius: '9999px',
  border: '1px solid',
  borderColor: 'divider',
  color: 'text.primary',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 600,
  '&:visited': { color: 'text.primary' },
  '&:hover': { backgroundColor: 'surface.badgePill' },
};

/**
 * Global public header (landing + directory): transparent so it blends with the page
 * background, with the business-directory search, modern borderless nav and the
 * primary `Registrar mi negocio` CTA. Shared so `/negocios` keeps the landing chrome.
 */
export function PublicHeader({ cta = DEFAULT_CTA }: PublicHeaderProps) {
  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      sx={{ px: { xs: 2, md: 3 }, py: 1.5, backgroundColor: 'transparent' }}
    >
      <Link href="/" aria-label="Foundly Book — inicio" style={{ display: 'flex' }}>
        <Image src="/branding-logo.png" alt="Foundly Book" width={140} height={70} priority />
      </Link>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <MuiLink
          component={Link}
          href="/negocios"
          underline="none"
          aria-label="Buscar negocios"
          sx={[SEARCH_LINK_SX, { px: { xs: 1.25, sm: 2 } }]}
        >
          <SearchIcon sx={{ fontSize: 18 }} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Buscar negocios
          </Box>
        </MuiLink>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
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
        </Stack>
        <Link href={cta.href} style={{ marginLeft: 8 }}>
          <Button variant="primary" sx={PRIMARY_BUTTON_SX}>
            {cta.label}
          </Button>
        </Link>
      </Stack>
    </Stack>
  );
}
