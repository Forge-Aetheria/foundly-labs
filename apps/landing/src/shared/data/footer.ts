import { apps } from '@/shared/data/apps';
import { siteConfig } from '@/shared/data/siteConfig';
import type { FooterColumn, FooterLink } from '@/shared/types';

const socialAria: Record<string, string> = {
  github: 'GitHub de Foundly Labs',
  x: 'X (Twitter) de Foundly Labs',
  linkedin: 'LinkedIn de Foundly Labs',
  youtube: 'YouTube de Foundly Labs',
  discord: 'Discord de Foundly Labs',
};

const ecosystemLinks: FooterLink[] = apps.map((app) => ({
  label: app.name,
  href: '/#apps',
}));

const resourceLinks: FooterLink[] = [
  { label: '¿Por qué Foundly?', href: '/#manifesto' },
  {
    label: 'Documentación',
    href: 'https://github.com/Ragomez33/foundly-labs',
    external: true,
    ariaLabel: 'Documentación de Foundly Labs en GitHub',
  },
  { label: 'Privacidad Local', href: '/privacy' },
];

const contactLinks: FooterLink[] = siteConfig.social.map((link) => ({
  label: link.label,
  href: link.href,
  external: true,
  ariaLabel: socialAria[link.platform] ?? `${link.label} de Foundly Labs`,
}));

export const footerColumns: FooterColumn[] = [
  { title: 'Ecosistema', links: ecosystemLinks },
  { title: 'Filosofía & Recursos', links: resourceLinks },
  { title: 'Contacto & Redes', links: contactLinks },
];

export const footerBrand = {
  copy: 'Ecosistema de aplicaciones rápidas y robustas para potenciar tus finanzas, comercio, reservas y estilo de vida.',
};

export const footerCopyright = '© 2026 Foundly Labs. Todos los derechos reservados.';
export const footerPoweredByLabel = 'Powered by';
