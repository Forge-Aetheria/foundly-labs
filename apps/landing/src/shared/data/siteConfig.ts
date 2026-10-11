import logo from '@/assets/branding-logo-fl.png';
import type { SiteConfig } from '@/shared/types';

export const siteConfig: SiteConfig = {
  name: 'Foundly Labs',
  defaultTitle: 'Foundly Labs | Ecosistema Software Local-First & Comercio Ágil',
  description:
    'Ecosistema de aplicaciones local-first para finanzas personales, comercio POS, sincronización karaoke y trading engine. Desarrollado por FORGE Labs.',
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
