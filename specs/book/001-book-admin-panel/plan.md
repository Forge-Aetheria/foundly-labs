# Implementation Plan: Foundly Book — Admin Panel (Appointments, Services & Availability)

**Branch**: `001-book-admin-panel` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/book/001-book-admin-panel/spec.md`

**Note**: Produced by `/speckit.plan`. Describes the technical approach and design artifacts for the `book` domain feature.

## Summary

Build the administrative panel for Foundly Book inside `apps/book`: an agenda that manages the appointment lifecycle, a catalog of services and rates, and an availability engine that turns working hours, breaks, blocked periods and existing appointments into bookable slots.

The panel is a Next.js (App Router) application rendered server-first, reusing the **@foundly/ui** design system for its interface. All admin screens render inside a persistent left **navigation shell** (sidebar) that carries the Foundly Book brand identity, the module sections and the active user profile, collapsing to a temporary drawer on small viewports. Domain rules (availability computation, conflict detection, lifecycle) are implemented as a pure, framework-agnostic TypeScript module so they are testable in isolation. For this version the panel runs on an **in-memory store (mock) expressed only with TypeScript types/interfaces**; the ecosystem's persistence strategy is **not yet defined**, so storage sits behind a single decoupled seam.

## Technical Context

**Language/Version**: TypeScript (strict), React 19, Node.js ≥ 20

**Primary Dependencies**: Next.js (App Router, current stable); `@foundly/ui` (workspace, MUI v6); Zod for input validation.

**Storage**: In-memory store (mock) behind `apps/book/src/shared/infra/store.ts`. The ecosystem's persistence strategy is **not yet defined** — no storage technology is chosen or implied.

**Testing**: Vitest for the availability engine and panel logic (pure domain); Vitest + React Testing Library + `vitest-axe` for panel components.

**Target Platform**: Web (server-rendered admin panel in the browser).

**Project Type**: web application module (`apps/book`) — a single workspace app, with no shared data package.

**Performance Goals**: Agenda for a day renders server-side in one round trip; availability computation for a weekday range stays well under 100 ms of CPU; large agendas use server-side pagination/windowing.

**Constraints**: All UI from `@foundly/ui` with no ad-hoc brand styling; no `any`/unsafe casts; no app imports from `packages/*`; no persistence technology may be introduced until it is decided in `specs/architecture.md`; SSR-safe.

**Scale/Scope**: 1 admin panel with ~3 main screens (agenda, services, availability), thousands of appointments and dozens of resources per business.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Authority hierarchy (Principle 1): `specs/business-model.md` > `constitution.md` > `specs/architecture.md` > `code-rules.md` > specs de dominio.

| Gate                                                                                                                          | Source                              | Status               |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------- |
| I. Rule of Law — spec references `specs/business-model.md` (Book module §2.3, Foundly Pass §3); monorepo boundaries respected | constitution §1                     | PASS                 |
| II. Spec-Driven Development — `spec.md` precedes this plan                                                                    | constitution §5.I                   | PASS                 |
| III. Server-First & Zero-JS — server components by default; client JS only for interactive views                              | constitution §5.II                  | PASS (constraint C1) |
| IV. Strict Typing — Zod validation + strict TS; no `any`                                                                      | constitution §5.IV                  | PASS                 |
| V. Performance & Core Web Vitals — server-rendered agenda, paginated/windowed lists                                           | constitution §5.III                 | PASS                 |
| VI. Clean Light UI — interface built exclusively from `@foundly/ui` tokens/components                                         | constitution §6, `code-rules.md` §4 | PASS                 |
| Packages rules — no shared data package introduced; `@foundly/ui` unchanged                                                   | constitution §3.II                  | PASS                 |
| Workflow gates — ESLint + type check + build                                                                                  | constitution §8                     | PASS                 |

**Constraints introduced by gates**:

- **C1**: Agenda/services/availability views are built exclusively from `@foundly/ui` components. The navigation shell (sidebar, lists, avatar, icons) uses MUI structural components styled only with theme tokens plus the `@foundly/ui` `Typography`/`Stack`/`Container` primitives, because the design system exposes no navigation-shell primitive.
- **C2**: Domain logic (availability, conflicts, lifecycle) contains no framework imports and no literal brand colors; the UI never computes availability itself.
- **C3**: No storage technology is introduced. Data access is confined to the in-memory store seam; swapping it later must not change the domain engine.

No unjustified violations → Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/book/001-book-admin-panel/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created here)
```

### Source Code (repository root)

```text
apps/book/                           # Next.js admin panel
├── src/
│   ├── app/                         # thin App Router routes → render <Modulo>View
│   │   ├── layout.tsx               # tokens.css + FoundlyThemeProvider + AppRouterCacheProvider
│   │   ├── page.tsx                 # → modules/landing/LandingView
│   │   ├── onboarding/              # → modules/onboarding/OnboardingView
│   │   ├── admin/                   # → each modules/<modulo>/<Modulo>View
│   │   │   ├── layout.tsx           # AdminShell (shared/components)
│   │   │   ├── agenda/page.tsx
│   │   │   ├── services/page.tsx
│   │   │   ├── availability/page.tsx
│   │   │   ├── configuracion/page.tsx
│   │   │   ├── soporte/page.tsx
│   │   │   └── acerca/page.tsx
│   │   └── [tenantSlug]/            # → modules/public-booking/PublicBookingView
│   ├── modules/<modulo>/            # domain modules (agenda, services, availability, staff, gallery, profile, onboarding, public-booking, landing)
│   │   └── <Modulo>View.tsx         # + components/, dialogs/, utils/, tests/
│   └── shared/
│       ├── components/              # AdminShell, AdminNavigation, PlaceholderPanel
│       ├── infra/                   # store.ts (seam), auth.ts, result.ts
│       ├── types/                   # appointments, availability, tenancy
│       └── utils/                   # computeAvailability, slug, provision, format, landingCanon
├── public/
│   ├── branding-logo.png            # Foundly Book full logo (sidebar header)
│   └── icon.png                     # Foundly Book isotipo (mobile header / favicon)
├── next.config.mjs                  # transpilePackages: ['@foundly/ui']
├── tsconfig.json
└── package.json
```

**Structure Decision**: The feature lives entirely in `apps/book`. Domain logic is isolated under `apps/book/src/shared` to keep it framework-free and unit-testable, and all data access goes through the single in-memory seam `apps/book/src/shared/infra/store.ts`. The admin shell (sidebar navigation, brand header and user profile) lives under `apps/book/src/shared/components/`; branding assets are served from `apps/book/public/`. No shared data package is created.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |
