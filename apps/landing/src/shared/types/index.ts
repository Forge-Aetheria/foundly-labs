export type SocialPlatform = 'x' | 'github' | 'linkedin' | 'youtube' | 'discord';

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  href: string;
}

export interface OrganizationRef {
  name: string;
  url: string;
}

export interface SiteConfig {
  name: string;
  defaultTitle: string;
  description: string;
  url: string;
  defaultImage: string;
  parentOrganization: OrganizationRef;
  social: SocialLink[];
}

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  canonicalURL?: string;
}

export interface Application {
  id: string;
  name: string;
  category: string;
  status: string;
  target: string;
  headline: string;
  subheadline: string;
  description: string;
  keyFeature: string;
  logo: string;
  icon: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface BaseLayoutProps {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  ariaLabel?: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}
