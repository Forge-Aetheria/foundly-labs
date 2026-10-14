'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import { Stack, Typography } from '@foundly/ui';
import type { PublicBusinessProfile } from '../utils/types';

const NAV_SECTIONS = [
  { id: 'servicios', label: 'Servicios' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'acerca', label: 'Acerca de' },
  { id: 'galeria', label: 'Galería' },
  { id: 'resenas', label: 'Reseñas' },
  { id: 'ubicacion', label: 'Ubicación' },
] as const;

/** Stable id list (module scope) so the observer effect does not re-run every render. */
const NAV_SECTION_IDS: readonly string[] = NAV_SECTIONS.map((section) => section.id);

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** Highlights the section currently in view (no-op when IntersectionObserver is unavailable). */
function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActive(visible.target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

/**
 * Public business header (feature `003`, amended): the business brand on the left, a clean
 * plain-text section nav in the centre (active item marked by a primary border-bottom) and the
 * business contact on the right. Anchored links scroll smoothly to each section.
 */
export function ProviderNav({ profile }: { profile: PublicBusinessProfile }) {
  const active = useActiveSection(NAV_SECTION_IDS);

  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      {/* Left: business brand */}
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexShrink: 0, minWidth: 0 }}>
        {profile.avatar ? (
          <Box
            component="img"
            src={profile.avatar}
            alt=""
            sx={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'surface.badgePill',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {initials(profile.name)}
          </Box>
        )}
        <Typography variant="subtitle1" component="p" sx={{ fontWeight: 700 }} noWrap>
          {profile.name}
        </Typography>
      </Stack>

      {/* Centre: internal navigation (plain text, active border-bottom) */}
      <Stack
        component="nav"
        aria-label="Secciones del negocio"
        direction="row"
        spacing={{ xs: 0.5, md: 1 }}
        sx={{ flexGrow: 1, minWidth: 0, overflowX: 'auto', alignItems: 'center', py: 0.5 }}
      >
        {NAV_SECTIONS.map((section) => {
          const isActive = active === section.id;
          return (
            <MuiLink
              key={section.id}
              href={`#${section.id}`}
              underline="none"
              aria-current={isActive ? 'true' : undefined}
              onClick={(event) => handleNavigate(event, section.id)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                px: 1.25,
                py: 0.75,
                borderBottom: 2,
                borderColor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? 'primary.main' : 'text.secondary',
                transition: 'color 120ms ease, border-color 120ms ease',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {section.label}
              </Typography>
            </MuiLink>
          );
        })}
      </Stack>

      {/* Right: contact */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ flexShrink: 0 }}>
        {profile.social?.whatsapp ? (
          <MuiLink href={profile.social.whatsapp} target="_blank" rel="noreferrer" underline="none">
            <Typography variant="body2" color="text.secondary">
              WhatsApp
            </Typography>
          </MuiLink>
        ) : null}
        {profile.phone ? (
          <MuiLink href={`tel:${profile.phone}`} underline="none">
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }} noWrap>
              {profile.phone}
            </Typography>
          </MuiLink>
        ) : null}
      </Stack>
    </Stack>
  );
}
