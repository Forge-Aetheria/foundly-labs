# Phase 1 Data Model: Production Copy & Branded Assets for the Apps Dataset

**Feature**: `003-real-apps-data` | **Date**: 2026-10-06

## Entities

### Application

The canonical, typed product record rendered by the ecosystem grid. Exactly four instances.

| Field         | Type     | Required | Source      | Notes                                                |
| ------------- | -------- | -------- | ----------- | ---------------------------------------------------- |
| `id`          | `string` | yes      | spec        | Stable kebab-case identifier; unique across records. |
| `name`        | `string` | yes      | spec        | Display name (e.g. "Foundly Maker").                 |
| `category`    | `string` | yes      | spec        | Production label (e.g. "Finanzas Personales").       |
| `status`      | `string` | yes      | spec        | Production label (e.g. "En Desarrollo").             |
| `target`      | `string` | yes      | spec        | Production label (e.g. "iOS / Android (Expo)").      |
| `headline`    | `string` | yes      | FR-002..005 | Value-proposition headline.                          |
| `subheadline` | `string` | yes      | FR-002..005 | Supporting one-line summary.                         |
| `description` | `string` | yes      | FR-002..005 | What the product solves (full production copy).      |
| `keyFeature`  | `string` | yes      | FR-002..005 | Short highlight of the flagship capability.          |
| `logo`        | `string` | yes      | FR-011      | Public URL to `/＜product＞/branding-logo.png`.      |
| `icon`        | `string` | yes      | FR-011      | Public URL to `/＜product＞/icon.png`.               |

**Validation rules** (enforced by the strict TypeScript contract + `astro check`):

- `id` MUST be non-empty and unique; no two records share an id.
- All string fields MUST be present and non-empty on every record; a missing field is a type error
  (satisfies FR-006, SC-001).
- `logo` and `icon` MUST be root-relative public paths matching the exact FR-011 values.
- No `any` / implicit `as`; the contract is declared in `src/shared/types/index.ts` (constitution IV).

**Ordering**: Records render in the dataset order: Foundly (Finance), Foundly POS, Foundly Maker,
Mixbit.

### Canonical Records

| id                       | name          | category            | status                  | target                             | logo                                 | icon                        |
| ------------------------ | ------------- | ------------------- | ----------------------- | ---------------------------------- | ------------------------------------ | --------------------------- |
| `foundly-mobile-finance` | Foundly       | Finanzas Personales | En Desarrollo           | iOS / Android (Expo)               | `/foundly-finance/branding-logo.png` | `/foundly-finance/icon.png` |
| `foundly-pos`            | Foundly POS   | Comercio & Ventas   | Beta Activa             | Mobile / Tablet (SQLite + Drizzle) | `/foundly-pos/branding-logo.png`     | `/foundly-pos/icon.png`     |
| `foundly-maker`          | Foundly Maker | Multimedia & Tools  | Producción / Disponible | Web / Desktop (Vite + React)       | `/foundly-maker/branding-logo.png`   | `/foundly-maker/icon.png`   |
| `mixbit`                 | Mixbit        | Trading Engine      | En Desarrollo           | Full-Stack (FastAPI + Next.js)     | `/mixbit/branding-logo.png`          | `/mixbit/icon.png`          |

Headline, subheadline, description and keyFeature for each record are specified verbatim in
[spec.md](./spec.md) FR-002 through FR-005 and MUST be copied exactly.

### Product Asset (presentation input)

A per-product image served from `public/<product>/`. Two kinds: `logo` (wordmark/branding) and
`icon` (isotipo). Files required:

```text
public/foundly-finance/branding-logo.png   (exists)
public/foundly-finance/icon.png             (exists)
public/foundly-pos/branding-logo.png        (exists)
public/foundly-pos/icon.png                 (exists)
public/foundly-maker/branding-logo.png      (exists)
public/foundly-maker/icon.png               (exists)
public/mixbit/branding-logo.png             (MISSING — must be added)
public/mixbit/icon.png                       (MISSING — must be added)
```

### Product Card (presentation)

Consumes one `Application` and renders:

- Header: product image (`icon || logo`) with controlled footprint, light compositing surface,
  and `alt` text; product name; category badge.
- Body: headline, subheadline, description, key feature; status and target.
- Clean Light UI tokens only; no client-side JavaScript.

## Relationships

```text
Application (1) ──renders-as──▶ Product Card (1)
Application (1) ──references──▶ Product Asset (logo, icon)  [2 per Application]
```

## State Transitions

N/A — the dataset is static build-time content; there is no runtime state.
