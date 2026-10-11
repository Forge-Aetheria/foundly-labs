# Phase 1 Data Model: Project Scaffold & Design System Foundation

**Feature**: `001-project-scaffold` | **Date**: 2026-10-05

This document describes the data structures introduced by the scaffold: the central site
configuration, the design-token set, navigation constants, and the schema-validated content
collections. Field types are logical; the implementation maps them to TypeScript interfaces and
Zod schemas.

## Entity: SiteConfig

Central defaults for the site, defined in `src/shared/data/siteConfig.ts` and consumed by
`BaseLayout.astro`.

| Field         | Type         | Required | Validation      | Notes                                    |
| ------------- | ------------ | -------- | --------------- | ---------------------------------------- |
| `name`        | string       | yes      | non-empty       | Initial value: `"Foundly Labs"`          |
| `description` | string       | yes      | non-empty       | Default meta description                 |
| `url`         | string       | yes      | absolute URL    | Canonical site origin; no trailing slash |
| `social`      | SocialLink[] | no       | each link valid | Defaults to an empty list                |

**Relationships**: `BaseLayout.astro` reads `SiteConfig` as the fallback for page metadata.

## Entity: SocialLink

| Field      | Type                                                      | Required | Validation   | Notes            |
| ---------- | --------------------------------------------------------- | -------- | ------------ | ---------------- |
| `platform` | `"x" \| "github" \| "linkedin" \| "youtube" \| "discord"` | yes      | one of enum  | Discriminator    |
| `label`    | string                                                    | yes      | non-empty    | Accessible label |
| `href`     | string                                                    | yes      | absolute URL | Profile URL      |

## Entity: NavItem

Static navigation constants in `src/shared/data/navigation.ts`.

| Field      | Type      | Required | Validation                    | Notes                   |
| ---------- | --------- | -------- | ----------------------------- | ----------------------- |
| `label`    | string    | yes      | non-empty                     | Visible text            |
| `href`     | string    | yes      | internal path or absolute URL | Destination             |
| `children` | NavItem[] | no       | —                             | Optional sub-navigation |

## Entity: DesignToken

The Clean Light UI palette, declared once in `src/styles/tokens.css`. This is the **only**
permitted source for brand colors.

| Field      | Type                                                                       | Required | Validation                  | Notes                             |
| ---------- | -------------------------------------------------------------------------- | -------- | --------------------------- | --------------------------------- |
| `name`     | string                                                                     | yes      | unique, `--color-*` prefix  | CSS custom property name          |
| `value`    | string                                                                     | yes      | valid color/gradient/shadow | Hex, rgba, or `linear-gradient()` |
| `category` | `"background" \| "accent" \| "text" \| "border" \| "shadow" \| "gradient"` | yes      | one of enum                 | Grouping only                     |

**Validation rules**:

- Every brand color used in a component MUST resolve to a token defined here.
- Component source MUST NOT contain literal brand hex values (enforced in review and by lint
  rules where practical).

**Canonical token set**:

| Token                         | Value                      | Category   |
| ----------------------------- | -------------------------- | ---------- |
| `--color-accent-primary`      | `#6C5CE7`                  | accent     |
| `--color-accent-primary-glow` | `rgba(108, 92, 231, 0.35)` | shadow     |
| `--color-accent-positive`     | `#10B981`                  | accent     |
| `--color-accent-gold`         | `#F59E0B`                  | accent     |
| `--color-app-body`            | `#FAFAFC`                  | background |
| `--color-surface-elevated`    | `#F4F3F8`                  | background |
| `--color-card-light`          | `#FFFFFF`                  | background |
| `--color-badge-pill`          | `#F0EEF9`                  | background |
| `--color-border-subtle`       | `#E6E4F0`                  | border     |
| `--color-gradient-from`       | `#C8B6FF`                  | gradient   |
| `--color-gradient-to`         | `#D8B4FE`                  | gradient   |
| `--color-primary`             | `#1E1B2E`                  | text       |
| `--color-secondary`           | `#6B7280`                  | text       |
| `--color-muted`               | `#9CA3AF`                  | text       |

## Content Collections

Defined in `src/content.config.ts` with the Content Layer `glob()` loader and Zod schemas. Each
collection MAY be empty; the build MUST succeed with zero entries.

### Collection: `pricing`

| Field               | Type     | Required | Validation                     |
| ------------------- | -------- | -------- | ------------------------------ |
| `id`                | string   | yes      | slug, unique within collection |
| `name`              | string   | yes      | non-empty                      |
| `description`       | string   | yes      | non-empty                      |
| `monthlyPriceCents` | number   | yes      | integer ≥ 0                    |
| `annualPriceCents`  | number   | yes      | integer ≥ 0                    |
| `features`          | string[] | yes      | may be empty                   |
| `badge`             | string   | no       | —                              |
| `highlighted`       | boolean  | no       | default `false`                |

### Collection: `faqs`

| Field      | Type   | Required | Validation   |
| ---------- | ------ | -------- | ------------ |
| `id`       | string | yes      | slug, unique |
| `question` | string | yes      | non-empty    |
| `answer`   | string | yes      | non-empty    |

### Collection: `features`

| Field         | Type   | Required | Validation      |
| ------------- | ------ | -------- | --------------- |
| `id`          | string | yes      | slug, unique    |
| `title`       | string | yes      | non-empty       |
| `description` | string | yes      | non-empty       |
| `icon`        | string | no       | icon identifier |
| `order`       | number | no       | integer ≥ 0     |

## State Transitions

None. All entities are immutable, build-time data; there is no runtime mutation.

## Type Location

Shared hand-written types (e.g. `SiteConfig`, `SocialLink`, `NavItem`) live in `src/shared/types/index.ts`.
Collection types are inferred from their Zod schemas via `astro:content`.
