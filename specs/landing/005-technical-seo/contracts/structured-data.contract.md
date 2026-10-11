# Contract: Structured Data (Schema.org JSON-LD)

**Feature**: `005-technical-seo` | **Type**: Data contract

Two JSON-LD blocks are emitted inline in the page head via
`<script type="application/ld+json" is:inline set:html={JSON.stringify(data)} />`.

## 1. Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Foundly Labs",
  "url": "https://foundlylabs.com",
  "logo": "https://foundlylabs.com/favicon.svg",
  "parentOrganization": {
    "@type": "Organization",
    "name": "FORGE Labs",
    "url": "https://www.forgelab.lat"
  }
}
```

## 2. SoftwareApplication list

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "SoftwareApplication",
      "name": "<Application.name>",
      "description": "<Application.description>",
      "applicationCategory": "<Application.category>",
      "operatingSystem": "<Application.target>",
      "author": { "@type": "Organization", "name": "Foundly Labs" }
    }
  ]
}
```

**Obligations**

- The `Organization` block MUST include FORGE Labs as `parentOrganization`.
- The `SoftwareApplication` list MUST be derived from `src/shared/data/apps.ts` (one item per application).
- Values MUST be serialized with `JSON.stringify` (safe escaping).
- The tags MUST be `is:inline` so Astro does not treat them as executable modules.

## Verification

- Parsing the built page yields valid JSON for both blocks.
- A schema validator reports zero errors.
- Source scan confirms the tags carry `is:inline` and no executable script is added.
