# Contract: Site Configuration & Base Layout

**Feature**: `001-project-scaffold` | **Type**: Application UI contract

## SiteConfig (`src/shared/data/siteConfig.ts`)

```ts
export interface SocialLink {
  platform: 'x' | 'github' | 'linkedin' | 'youtube' | 'discord';
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  social: SocialLink[];
}

export const siteConfig: SiteConfig;
```

**Obligations**

- `name` MUST default to `"Foundly Labs"`.
- `url` MUST be an absolute URL with no trailing slash.
- `social` MUST be present (may be empty) and each entry MUST have an absolute `href`.

## BaseLayout (`src/shared/components/BaseLayout.astro`)

```ts
export interface Props {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
}
```

**Obligations**

- Renders `<html lang="es">`.
- `<head>` MUST include charset, viewport, title, description, canonical, Open Graph
  (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`), Twitter
  (`twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`),
  and a favicon link.
- Missing `title` / `description` / `image` / `canonical` MUST fall back to `siteConfig` / sensible
  defaults. Final `<title>` SHOULD compose as `<page title> · Foundly Labs`.
- MUST preload the body/heading fonts used above the fold.
- MUST apply the global background (Lavender-to-White) and render a `<slot />` for page content.
- MUST import `src/styles/global.css` so Tailwind and tokens are available on every page.

## Verification

- Inspect built HTML of a page using the layout: all metadata tags present; `lang="es"`; preload
  links present.
- A page passing `title`/`description` overrides the defaults.
