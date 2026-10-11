# Contract: Branding, Title & Navbar

**Feature**: `002-branding-apps-grid` | **Type**: Layout / navigation UI contract

## BaseLayout (`src/shared/components/BaseLayout.astro`) — extended

```ts
export interface BaseLayoutProps {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
}
```

**Obligations**

- `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` MUST reference the isotipo.
- Document title MUST be `siteConfig.defaultTitle` when no `title` is given, and
  `${title} · ${siteConfig.defaultTitle}` when a page title is provided.
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) MUST reflect the
  official brand; the default `og:image` MUST be the full logo asset URL.
- The navbar MUST render once, site-wide, from `BaseLayout`.

## Navbar (`src/shared/components/Navbar.astro`) — new

```ts
interface Props {
  items?: NavItem[]; // defaults to the shared navigation data
}
```

**Obligations**

- MUST display the full Foundly Labs logo (`<Image />` from `src/assets/branding-logo-fl.png`) with
  a text alternative "Foundly Labs".
- MUST render the links from `src/shared/data/navigation.ts`, including `Ecosistema → /#apps` and
  `Local-First → /#manifesto`.
- MUST be usable without JavaScript and keyboard navigable.
- MUST present a mobile menu via a CSS-only disclosure; desktop links visible from the `md`
  breakpoint.
- MUST NOT use any `client:*` hydration directive.

## Verification

- Built HTML includes the favicon link, official title, and OG tags with the logo image URL.
- Clicking "Ecosistema"/"Local-First" reaches the `#apps`/`#manifesto` sections.
- With JavaScript disabled, links and the mobile menu still function.
