'use client';

import { alpha } from '@mui/material/styles';
import MuiLink from '@mui/material/Link';
import { Stack, Typography } from '@foundly/ui';
import { SECONDARY_BUTTON_SX } from '../../../../app/components/landingCanon';

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

/** Sticky in-page navigation with smooth-scroll anchor pills (provider landing). */
export function ProviderNav() {
  return (
    <Stack
      component="nav"
      aria-label="Secciones del negocio"
      direction="row"
      spacing={1}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        flexWrap: 'nowrap',
        overflowX: 'auto',
        px: { xs: 1.5, md: 3 },
        py: 1,
        backgroundColor: 'var(--book-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: 1,
        borderColor: (theme) => alpha(theme.palette.border.subtle, 0.6),
      }}
    >
      {NAV_SECTIONS.map((section) => (
        <MuiLink key={section.href} href={section.href} underline="none" sx={NAV_LINK_SX}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {section.label}
          </Typography>
        </MuiLink>
      ))}
    </Stack>
  );
}