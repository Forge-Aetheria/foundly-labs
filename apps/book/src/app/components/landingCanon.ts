import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

/**
 * Landing-canonic visual tokens — `apps/landing` (Astro) is the design canon.
 *
 * Shared across the product page (`/`), the public portal (`/[tenantSlug]`)
 * and the guided booking checkout so every surface mirrors the landing:
 * glass cards (translucent), pill buttons and `#6C5CE7` accent accents.
 */

/** Primary pill button: accent surface, lavender shadow, 90% hover (Button.astro primary). */
export const PRIMARY_BUTTON_SX: SystemStyleObject<Theme> = {
  boxShadow: (theme) => theme.palette.shadow.card,
  '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.9) },
};

/** Secondary pill button: translucent glass surface, blur, badge-pill hover (Button.astro secondary). */
export const SECONDARY_BUTTON_SX: SystemStyleObject<Theme> = {
  backgroundColor: 'var(--book-glass-card)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  '&:hover': { backgroundColor: 'surface.badgePill' },
};

/** Translucent glass card — mirror of the landing `AppCard` (`bg-card-light/60`). */
export const GLASS_CARD_SX: SystemStyleObject<Theme> = {
  backgroundColor: 'var(--book-glass-card)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
};

/** Canonical pill surface: `badgePill` background + `primary.main` accent text (Badge.astro). */
export const PILL_SX: SystemStyleObject<Theme> = {
  display: 'inline-flex',
  px: 1.5,
  py: 0.5,
  borderRadius: '9999px',
  backgroundColor: 'surface.badgePill',
  color: 'primary.main',
};