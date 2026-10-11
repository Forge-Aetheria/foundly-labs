# Contract: SEO Component

**Feature**: `005-technical-seo` | **Type**: Head/UI contract

## Component: `src/shared/components/SEO.astro`

```ts
interface Props {
  title?: string;
  description?: string;
  image?: string;
  canonicalURL?: string;
}
```

**Obligations**

- MUST be the single source for page head metadata; `src/shared/components/BaseLayout.astro` MUST render it
  inside `<head>` and pass `title`, `description`, `image`, `canonicalURL` through.
- MUST emit exactly one `<title>`, one `<meta name="description">`, and one
  `<link rel="canonical">` (absolute URL).
- MUST emit Open Graph tags: `og:type=website`, `og:site_name=Foundly Labs`, `og:title`,
  `og:description`, `og:url`, `og:image`.
- MUST emit Twitter Card tags: `twitter:card=summary_large_image`, `twitter:title`,
  `twitter:description`, `twitter:image`.
- MUST fall back to `siteConfig` defaults for any omitted input.
- MUST resolve relative `image`/`canonicalURL` values to absolute URLs against the site origin.
- MUST emit the JSON-LD blocks defined in [structured-data.contract.md](./structured-data.contract.md).
- MUST NOT add executable client-side JavaScript.

## Verification

- Built HTML for every route contains the title, description, canonical, OG and Twitter tags.
- A page passing its own `title`/`description` overrides the defaults.
- `dist/index.html` contains the JSON-LD `<script type="application/ld+json">` blocks and no other
  executable script introduced by this feature.
