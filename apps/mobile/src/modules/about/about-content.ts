import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface LegalLink {
  id: string;
  label: string;
  description: string;
  url: string;
  icon: IconName;
}

export const ABOUT_TAGLINE = 'Software local-first para negocios que quieren avanzar.';

export const ABOUT_DESCRIPTION =
  'Foundly Book es el módulo de agenda y gestión de Foundly Labs. Esta app móvil permite a los administradores de tenant consultar su agenda, gestionar servicios, equipo, galería, reseñas y disponibilidad desde el dispositivo.';

export const ABOUT_LEGAL_LINKS: LegalLink[] = [
  {
    id: 'website',
    label: 'Foundly Labs',
    description: 'foundlylabs.com',
    url: 'https://foundlylabs.com',
    icon: 'globe-outline',
  },
  {
    id: 'privacy',
    label: 'Política de privacidad',
    description: 'Cómo tratamos tus datos',
    url: 'https://foundlylabs.com/privacy',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'terms',
    label: 'Términos de uso',
    description: 'Condiciones del servicio',
    url: 'https://foundlylabs.com/terms',
    icon: 'document-text-outline',
  },
];
