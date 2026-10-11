# Phase 1 Data Model: Branding Integration & Apps Grid

**Feature**: `002-branding-apps-grid` | **Date**: 2026-10-05

This document describes the data structures introduced or extended by the feature. Types are
declared in TypeScript; there is no runtime persistence.

## Entity: Application

Represents a product in the Foundly Labs ecosystem. Defined as `Application` in
`src/shared/types/index.ts` and populated in `src/shared/data/apps.ts`.

| Field         | Type   | Required | Validation         | Notes                                     |
| ------------- | ------ | -------- | ------------------ | ----------------------------------------- |
| `id`          | string | yes      | unique, kebab-case | Stable key for list rendering and anchors |
| `name`        | string | yes      | non-empty          | Display name                              |
| `category`    | string | yes      | non-empty          | Display label (e.g. "Comercio")           |
| `status`      | string | yes      | non-empty          | Display label (e.g. "Beta Activa")        |
| `target`      | string | yes      | non-empty          | Display label (e.g. "Desktop / Web")      |
| `description` | string | yes      | non-empty          | Verbatim marketing copy                   |

**Relationships**: Consumed by `AppsGrid.astro`; each instance maps to one `AppCard.astro`.

**Canonical records** (authoritative copy):

| id                       | name        | category            | status                  | target                             | description                                                                                                                                                                               |
| ------------------------ | ----------- | ------------------- | ----------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `foundly-mobile-finance` | Foundly     | Finanzas Personales | En Desarrollo           | iOS / Android (Expo)               | Aplicación móvil de gestión financiera basada en la fórmula del Saldo Disponible (Net Available Balance). Control total de gastos, ingresos, deudas y ahorros en un entorno 100% local.   |
| `foundly-pos`            | Foundly POS | Comercio & Ventas   | Beta Activa             | Mobile / Tablet (SQLite + Drizzle) | Punto de venta ultrarrápido y local-first para pequeños comercios. Cero dependencia de APIs en la nube, precisión financiera en centavos enteros y registro de ventas en 2 taps.          |
| `lrc-maker`              | LRC-Maker   | Multimedia & Tools  | Producción / Disponible | Web / Desktop (Vite + React)       | Herramienta de escritorio en navegador para sincronización de letras estilo karaoke. Procesamiento de audio de baja latencia y exportación .lrc / .ass 100% en el cliente sin servidores. |
| `mixbit`                 | Mixbit      | Trading Engine      | En Desarrollo           | Full-Stack (Next.js + FastAPI)     | Bot de Grid Trading local-first. Control de estrategias de trading, ejecución multiactivo con CCXT y persistencia privada en base de datos SQLite aislada.                                |

**Validation rules**:

- `id` values MUST be unique within `apps.ts`.
- All fields MUST be non-empty strings.
- The list MUST contain exactly the four records above, in this order.

## Entity: NavigationLink (existing `NavItem`)

Stored in `src/shared/data/navigation.ts`; shape unchanged (`label`, `href`, optional `children`).

**Updated records**:

| label       | href          |
| ----------- | ------------- |
| Inicio      | `/`           |
| Ecosistema  | `/#apps`      |
| Local-First | `/#manifesto` |

**Validation rules**: each `href` MUST resolve to an existing section or route; no dead anchors.

## Entity: SiteConfig (extended)

`src/shared/data/siteConfig.ts` gains a `defaultTitle` field.

| Field          | Type   | Required | Validation | Notes          |
| -------------- | ------ | -------- | ---------- | -------------- |
| `defaultTitle` | string | yes      | non-empty  | `"Foundly Labs | Local-First Software Ecosystem"` |

Existing fields (`name`, `description`, `url`, `social`) are unchanged.

## Entity: BrandAsset

Static brand images. No runtime entity; documented for traceability.

| Asset           | Path                              | Usage                                    | Notes                                         |
| --------------- | --------------------------------- | ---------------------------------------- | --------------------------------------------- |
| Isotipo favicon | `public/favicon.svg`              | `<link rel="icon">` in `BaseLayout`      | Root-relative `/favicon.svg`                  |
| Isotipo source  | `src/assets/icon-fl.png`          | Hero watermark source (via `<Image />`)  | Moved from `public/`; rendered by feature 004 |
| Full logo       | `src/assets/branding-logo-fl.png` | Navbar via `<Image />`; default OG image | Moved from `public/` for `<Image />` support  |

## State Transitions

None. All entities are immutable, build-time data.
