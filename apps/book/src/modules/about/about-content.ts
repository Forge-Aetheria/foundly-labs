export interface LegalLink {
  id: string;
  label: string;
  description: string;
  href: string;
}

export const BOOK_APP_VERSION = '0.1.0';

export const ABOUT_TAGLINE = 'Software local-first para negocios que quieren avanzar.';

export const ABOUT_DESCRIPTION =
  'Foundly Book es el módulo de agenda y gestión de Foundly Labs. Este panel permite administrar el perfil público, servicios, equipo, galería, reseñas, disponibilidad y pagos de tu negocio.';

export const ABOUT_LEGAL_LINKS: LegalLink[] = [
  {
    id: 'website',
    label: 'Foundly Labs',
    description: 'foundlylabs.com',
    href: 'https://foundlylabs.com',
  },
  {
    id: 'privacy',
    label: 'Política de privacidad',
    description: 'Cómo tratamos tus datos',
    href: 'https://foundlylabs.com/privacy',
  },
  {
    id: 'terms',
    label: 'Términos de uso',
    description: 'Condiciones del servicio',
    href: 'https://foundlylabs.com/terms',
  },
];
