import logo from '@/assets/branding-logo-fl.png';
import type { SiteConfig } from '@/shared/types';

export const siteConfig: SiteConfig = {
  name: 'Foundly Labs',
  defaultTitle: 'Foundly Labs | Comercio Ágil, Gestión Total, Cero Fricción',
  description:
    'El ecosistema Foundly Labs: herramientas rápidas, robustas y diseñadas bajo tu control para potenciar tus finanzas, comercio, reservas y estilo de vida.',
  url: 'https://foundlylabs.com',
  defaultImage: logo.src,
  parentOrganization: {
    name: 'FORGE Labs',
    url: 'https://www.forgelab.lat',
  },
  social: [
    {
      platform: 'github',
      label: 'GitHub',
      href: 'https://github.com/Ragomez33',
    },
    {
      platform: 'x',
      label: 'X',
      href: 'https://x.com/foundlylabs',
    },
  ],
};
