# Implementation Plan: Foundly Book — Business Onboarding & Tenant Flow

**Branch**: `002-onboarding-and-tenant-flow` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/book/002-onboarding-and-tenant-flow/spec.md`

**Note**: Produced by `/speckit.plan`. Describes the technical approach and design artifacts for the `book` domain feature.

## Summary

Introduce the business-registration and tenancy layer of Foundly Book: a public product page (`/book`), a three-step onboarding wizard (`/book/onboarding`) that creates a **Tenant** (business) and its owner **User**, a tenant-scoped private dashboard (`/book/admin/*`) that reuses the existing Drawer shell, and a public booking portal addressed by the business's slug (`/book/[tenantSlug]`).

The feature is a Next.js (App Router) module inside `apps/book`, rendered server-first and composed from the **@foundly/ui** design system. The new tenancy domain (tenant, owner, slug, business hours, plan/license reference) is modelled as **pure TypeScript interfaces** and held in the **existing in-memory store seam**, which is extended with `tenants`, `users` and `sessions` collections. Slug validation, tenant resolution and provisioning are pure functions so they are testable in isolation. The onboarding wizard preserves its draft locally (local-first) and submits a single server action that provisions the tenant atomically. The module's public URLs are the multi-zone `/book/*` prefix; internally the app serves `/`, `/onboarding`, `/admin/*` and `/[tenantSlug]`.

## Technical Context

**Language/Version**: TypeScript (strict), React 19, Next.js App Router (current stable), Node.js ≥ 20

**Primary Dependencies**: `@foundly/ui` (workspace, MUI v6) + `@mui/icons-material`; `@mui/material-nextjs` (`AppRouterCacheProvider`); Zod for input validation; Next.js routing (`next/navigation`, route groups, dynamic segments)

**Storage**: In-memory store (mock) behind the existing `apps/book/src/shared/infra/store.ts` seam, extended with `tenants`/`users`/`sessions`. The ecosystem's persistence strategy is **not yet defined** — no storage technology is introduced (per `specs/architecture.md`).

**Testing**: Vitest for pure tenancy logic (slug rules, tenant resolution, provisioning); Vitest + React Testing Library + `vitest-axe` for the wizard steps, the admin guard and the public portal

**Target Platform**: Web (server-rendered Next.js module, deployed as the `/book` multi-zone under a single domain)

**Project Type**: web application module (`apps/book`), no shared data package

**Performance Goals**: Product page and public portal resolve and render server-side in one round trip; slug resolution is a single indexed lookup in the store seam; the wizard's step transitions stay interactive (< 100 ms local validation)

**Constraints**: All UI from `@foundly/ui` with no ad-hoc brand styling; no `any`/unsafe casts; no app imports from `packages/*` beyond `@foundly/ui`; no persistence technology; SSR-safe; strict per-tenant data isolation; onboarding draft is local-first (survives reload/offline)

**Scale/Scope**: 4 surfaces (product page, wizard, admin dashboard, public portal); a 3-step wizard; tens of thousands of tenants; per-tenant services/rates/resources/availability/appointments from the existing admin panel

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Authority hierarchy (Principle 1): `specs/business-model.md` > `constitution.md` > `specs/architecture.md` > `code-rules.md` > specs de dominio.

| Gate                                                                                                                                | Source                              | Status               |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------- |
| I. Rule of Law — spec references `specs/business-model.md` (Book §2.3, Foundly Pass §3); monorepo boundaries respected              | constitution §1                     | PASS                 |
| II. Spec-Driven Development — `spec.md` precedes this plan                                                                          | constitution §5.I                   | PASS                 |
| III. Server-First & Zero-JS — server components by default; client JS only for the wizard and interactive portal                    | constitution §5.II                  | PASS (constraint C1) |
| IV. Strict Typing — Zod schemas + strict TS; no `any`                                                                               | constitution §5.IV                  | PASS                 |
| V. Performance & Core Web Vitals — server-rendered public surfaces, single-round-trip portal                                        | constitution §5.III                 | PASS                 |
| VI. Clean Light UI — interface built exclusively from `@foundly/ui` tokens/components (admin shell uses token-styled MUI structure) | constitution §6, `code-rules.md` §4 | PASS                 |
| Specs-by-domain — feature lives in `specs/book/` with a domain-bounded scope                                                        | constitution §2                     | PASS                 |
| Deployment topology — public `/book/*` served through the multi-zone gateway defined in `specs/architecture.md` §2                  | `specs/architecture.md`             | PASS                 |
| Packages rules — no shared data package introduced; `@foundly/ui` unchanged                                                         | constitution §3.II                  | PASS                 |
| Workflow gates — ESLint + type check + build                                                                                        | constitution §8                     | PASS                 |

**Constraints introduced by gates**:

- **C1**: The product page, wizard, admin screens and public portal are built exclusively from `@foundly/ui` components; the admin shell reuses the token-styled MUI structure already established in `001-book-admin-panel`.
- **C2**: Tenancy logic (slug normalization/validation, reserved words, tenant resolution, provisioning defaults) contains no framework imports and no literal brand colors; it is a pure, unit-testable module.
- **C3**: No storage technology is introduced. The tenant/user/session data lives behind the single in-memory store seam; swapping it later must not change the tenancy logic or the views.
- **C4**: Every read/write of business data is scoped to the authenticated tenant from the session; the public portal resolves a tenant by slug and only exposes active/licensed businesses.
- **C5**: The wizard draft is local-first (client-persisted) and provisioning is a single idempotent action to avoid duplicates on retry.

## Project Structure

### Documentation (this feature)

```text
specs/book/002-onboarding-and-tenant-flow/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── tenancy.contract.md
│   ├── onboarding.contract.md
│   └── routes.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
apps/book/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # root: tokens.css + AppRouterCacheProvider + FoundlyThemeProvider
│   │   ├── page.tsx                 # product page                       → public /book
│   │   ├── onboarding/
│   │   │   ├── page.tsx             # wizard entry                       → public /book/onboarding
│   │   │   └── components/          # AccountStep, BusinessStep, SetupStep, WizardShell
│   │   ├── admin/
│   │   │   ├── layout.tsx           # AdminShell + tenant/auth guard     → public /book/admin/*
│   │   │   ├── components/          # AdminShell, navigation, PlaceholderPanel (relocated from (admin))
│   │   │   ├── agenda/page.tsx
│   │   │   ├── services/page.tsx
│   │   │   ├── availability/page.tsx
│   │   │   ├── configuracion/page.tsx
│   │   │   ├── soporte/page.tsx
│   │   │   └── acerca/page.tsx
│   │   └── [tenantSlug]/
│   │       ├── page.tsx             # public booking portal              → public /book/<slug>
│   │       └── components/          # TenantPublicHeader, ServiceList, BookingPanel
│   ├── modules/<modulo>/            # domain modules per surface
│   │   ├── onboarding/              # components/ (WizardShell, AccountStep, BusinessStep, SetupStep), utils/ (schemas, actions, draft), tests/
│   │   └── public-booking/          # components/, dialogs/, utils/ (queries, actions, schemas, types)
│   └── shared/
│       ├── components/              # AdminShell, AdminNavigation, PlaceholderPanel
│       ├── infra/                   # store.ts (seam extended with tenants, users, sessions), auth.ts, result.ts
│       ├── types/                   # appointments, availability, tenancy (Tenant, User, BusinessHours, TenantStatus, UserRole)
│       ├── utils/                   # slug.ts, provision.ts, computeAvailability, format
│       └── tenancy/                 # queries.ts (getTenantBySlug, getCurrentTenant)
├── public/
│   ├── branding-logo.png
│   └── icon.png
├── next.config.mjs
├── tsconfig.json
└── package.json
```

**Structure Decision**: The feature lives entirely in `apps/book`. The private dashboard moves from the route group `(admin)` to a real `/admin` segment so that `/admin/*` is the authenticated surface while `/`, `/onboarding` and `/[tenantSlug]` remain public. Tenancy logic is isolated under `apps/book/src/shared` (framework-free, C2) and all data access goes through the single store seam (C3). The existing 001 domain and views are reused unchanged except for tenant scoping. No shared data package is created.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |
