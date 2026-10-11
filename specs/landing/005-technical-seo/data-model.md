# Phase 1 Data Model: Technical SEO & Metadata

**Feature**: `005-technical-seo` | **Date**: 2026-10-05

This document describes the data structures involved: the SEO component's inputs, the extended site
configuration, and the Schema.org objects emitted as JSON-LD.

## Entity: SEOProps

Inputs accepted by `src/shared/components/SEO.astro`. All optional; each falls back to a default.

| Field          | Type   | Required | Validation                    | Default                   |
| -------------- | ------ | -------- | ----------------------------- | ------------------------- |
| `title`        | string | no       | non-empty if provided         | `siteConfig.defaultTitle` |
| `description`  | string | no       | non-empty if provided         | `siteConfig.description`  |
| `image`        | string | no       | absolute or site-relative URL | `siteConfig.defaultImage` |
| `canonicalURL` | string | no       | absolute or site-relative URL | current page absolute URL |

**Composition rule**: when a page `title` is provided, the document title is
`"<title> · <siteConfig.name>"`; otherwise it is the default title.

## Entity: SiteConfig (extended)

`src/shared/data/siteConfig.ts` gains the official SEO defaults and parent organization.

| Field                | Type            | Required | Notes                                                                   |
| -------------------- | --------------- | -------- | ----------------------------------------------------------------------- |
| `name`               | string          | yes      | `"Foundly Labs"` (existing)                                             |
| `defaultTitle`       | string          | yes      | `"Foundly Labs                                                          | Ecosistema Software Local-First & Comercio Ágil"` (updated) |
| `description`        | string          | yes      | Official description including "Desarrollado por FORGE Labs." (updated) |
| `url`                | string          | yes      | `"https://foundlylabs.com"` (existing)                                  |
| `defaultImage`       | string          | yes      | Official brand asset URL used for OG/Twitter (new)                      |
| `parentOrganization` | OrganizationRef | yes      | FORGE Labs (new)                                                        |
| `social`             | SocialLink[]    | yes      | existing                                                                |

### Entity: OrganizationRef

| Field  | Type   | Required | Notes                        |
| ------ | ------ | -------- | ---------------------------- |
| `name` | string | yes      | `"FORGE Labs"`               |
| `url`  | string | yes      | `"https://www.forgelab.lat"` |

## Structured data: Organization

Emitted as JSON-LD on every page.

| JSON-LD field        | Value                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------- |
| `@context`           | `"https://schema.org"`                                                                 |
| `@type`              | `"Organization"`                                                                       |
| `name`               | `"Foundly Labs"`                                                                       |
| `url`                | `siteConfig.url`                                                                       |
| `logo`               | absolute URL of the favicon/isotipo                                                    |
| `parentOrganization` | `{ "@type": "Organization", "name": "FORGE Labs", "url": "https://www.forgelab.lat" }` |

## Structured data: SoftwareApplication (ecosystem)

Derived from `src/shared/data/apps.ts`; emitted as an `ItemList` of `SoftwareApplication` items.

| JSON-LD field          | Source                                                |
| ---------------------- | ----------------------------------------------------- |
| `@type`                | constant `"SoftwareApplication"`                      |
| `name`                 | `Application.name`                                    |
| `description`          | `Application.description`                             |
| `applicationCategory`  | `Application.category`                                |
| `operatingSystem`      | `Application.target`                                  |
| `author` / `publisher` | `{ "@type": "Organization", "name": "Foundly Labs" }` |

**Validation rules**

- All required string fields MUST be non-empty.
- JSON MUST be produced via `JSON.stringify` so quotes/accents/ampersands are escaped.
- The Organization object MUST reference FORGE Labs as `parentOrganization`.

## Entity: Sitemap Entry

Produced at build time by the sitemap integration. Each entry is a public route with its absolute
URL (e.g. `https://foundlylabs.com/`, `.../privacy/`, `.../terms/`). Private/utility routes are
excluded.

## Entity: Robots Policy

`public/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://foundlylabs.com/sitemap-index.xml
```

## State Transitions

None. All entities are build-time data.
