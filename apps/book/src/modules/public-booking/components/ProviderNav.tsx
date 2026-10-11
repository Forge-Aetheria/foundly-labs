'use client';

import Image from 'next/image';
import { alpha } from '@mui/material/styles';
import MuiLink from '@mui/material/Link';
import { Stack, Typography } from '@foundly/ui';
import { SECONDARY_BUTTON_SX } from '../../../shared/utils/landingCanon';

const NAV_SECTIONS = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#equipo', label: 'Equipo' },
  { href: '#acerca', label: 'Acerca de' },
  { href: '#galeria', label: 'Galería' },
  { href: '#resenas', label: 'Reseñas' },
  { href: '#direccion', label: 'Dirección' },
] as const;

const NAV_LINK_SX = {
  ...SECONDARY_BUTTON_SX,
  display: 'inline-flex',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  px: 2,
  py: 1,
  borderRadius: '9999px',
  textDecoration: 'none',
} as const;

/**
 * Sticky provider header: official Foundly Book branding on the left, aligned
 * with the smooth-scroll anchor pills that navigate the business sections.
 */
export function ProviderNav() {
  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      spacing={{ xs: 1.5, md: 3 }}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        px: { xs: 1.5, md: 3 },
        py: 1,
        backgroundColor: 'var(--book-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: 1,
        borderColor: (theme) => alpha(theme.palette.border.subtle, 0.6),
      }}
    >
      <MuiLink
        href="/"
        aria-label="Foundly Book — inicio"
        underline="none"
        sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        <Image
          src="/branding-logo.png"
          alt="Foundly Book"
          width={120}
          height={60}
          priority
          style={{ height: 44, width: 'auto' }}
        />
      </MuiLink>
      <Stack
        component="nav"
        aria-label="Secciones del negocio"
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexGrow: 1, minWidth: 0, overflowX: 'auto', py: 0.5 }}
      >
        {NAV_SECTIONS.map((section) => (
          <MuiLink key={section.href} href={section.href} underline="none" sx={NAV_LINK_SX}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {section.label}
            </Typography>
          </MuiLink>
        ))}
      </Stack>
    </Stack>
  );
}
