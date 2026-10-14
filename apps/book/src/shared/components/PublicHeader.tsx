'use client';

import Image from 'next/image';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import { Button, Stack, Typography } from '@foundly/ui';
import { PRIMARY_BUTTON_SX } from '../utils/landingCanon';

export interface PublicHeaderProps {
  /** Primary call to action (defaults to the onboarding entry). */
  cta?: { href: string; label: string };
  /** Secondary "demo" link (defaults to the sample business). */
  demo?: { href: string; label: string };
}

const DEFAULT_CTA = { href: '/onboarding', label: 'Registrar mi negocio' };
const DEFAULT_DEMO = { href: '/estudio-ana', label: 'Ver Demo' };

/**
 * Global public header (landing + discovery): brand, the **Negocios** directory link,
 * the demo link and the primary CTA. Shared so `/negocios` keeps the landing navigation.
 */
export function PublicHeader({
  cta = DEFAULT_CTA,
  demo = DEFAULT_DEMO,
}: PublicHeaderProps) {
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
          <Link href="/negocios" style={{ textDecoration: 'none' }}>
            Negocios
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
