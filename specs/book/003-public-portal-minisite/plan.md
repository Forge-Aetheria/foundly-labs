# Implementation Plan: Foundly Book — Public Portal Mini-Site (Setmore-style)

**Branch**: `003-public-portal-minisite` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/book/003-public-portal-minisite/spec.md`

**Note**: Produced by `/speckit.plan`. Describes the technical approach and design artifacts for the `book` domain feature.

## Summary

Turn the public portal (`/book/<slug>` → internal `/[tenantSlug]`) into a complete **mini-site** in the Setmore style, staying 100% inside the Clean Light UI design system. The portal gains a **brand hero** (cover, avatar/logo, name, category, badges, "Sobre nosotros", contact data), an accessible **tabs system** (Servicios por defecto · Equipo/Especialistas · Información & Políticas) and a **guided 4-step booking flow** (specialist → date/slots → client data → confirmation) that reuses the existing availability engine and the `origin: 'online'` booking action.

The feature is a UI/UX refactor of `apps/book`'s public-booking feature plus a small data extension: the **tenant profile** (bio, avatar/logo ref, address, phone, social links), **specialist metadata** (role/avatar on the existing `Resource`) and **portal policies** are seeded mock data in the store seam (no storage/CMS technology). All reads are server-side and SSR-safe; the booking flow is a client interaction inside an `@foundly/ui` `Modal` stepping through pure action/seam code.

## Technical Context

**Language/Version**: TypeScript (strict), React 19, Next.js App Router (current stable), Node.js ≥ 20

**Primary Dependencies**: `@foundly/ui` (workspace, MUI v6) primitives (`Card`, `Button`, `Modal`, `Badge`, `Chip`, `Typography`, `Stack`, `Container`); `@mui/icons-material` (already a book dependency); Zod for client-field validation; Next.js routing/dynamic segments

**Storage**: In-memory store seam (`apps/book/src/shared/infra/store.ts`) extended with tenant profile, specialist metadata and portal policies; **no persistence technology** (deferred per `specs/architecture.md`)

**Testing**: Vitest + React Testing Library + `vitest-axe` for the portal components and the booking flow; Vitest for the portal query contract and the slot/conflict behavior

**Target Platform**: Web (server-rendered Next.js module, multi-zone `/book/<slug>`)

**Project Type**: web application module (`apps/book`), no shared data package

**Performance Goals**: Portal SSR in one round trip; slot lookup per resource stays well under 100 ms; the booking modal runs client-side without page reloads

**Constraints**: UI composed exclusively from `@foundly/ui` + theme tokens (pill buttons, `#6C5CE7`, bold typography, rounded cards); no `any`; SSR-safe; no persistence technology; unknown/draft/suspended tenants expose no data; the whole portal is keyboard-operable with zero critical a11y violations

**Scale/Scope**: 1 public portal refactor; 3 tabs; a 4-step booking flow; seeded profile/specialist/policy data; tens of thousands of tenants

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Authority hierarchy (Principle 1): `specs/business-model.md` > `constitution.md` > `specs/architecture.md` > `code-rules.md` > specs de dominio.

| Gate                                                                                                                   | Source                              | Status               |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------- |
| I. Rule of Law — spec references `specs/business-model.md` (Book §2.3, Foundly Pass §3); monorepo boundaries respected | constitution §1                     | PASS                 |
| II. Spec-Driven Development — `spec.md` precedes this plan                                                             | constitution §5.I                   | PASS                 |
| III. Server-First & Zero-JS — portal SSR; client JS only for the booking modal and interactive tabs                    | constitution §5.II                  | PASS (constraint C1) |
| IV. Strict Typing — Zod validation for client data + strict TS; no `any`                                               | constitution §5.IV                  | PASS                 |
| V. Performance & Core Web Vitals — SSR portal, no horizontal overflow                                                  | constitution §5.III                 | PASS                 |
| VI. Clean Light UI — interface composed exclusively from `@foundly/ui` tokens/components                               | constitution §6, `code-rules.md` §4 | PASS                 |
| Specs-by-domain — feature lives in `specs/book/` and refines the existing portal (002)                                 | constitution §2                     | PASS                 |
| Packages rules — no shared data package introduced; `@foundly/ui` unchanged                                            | constitution §3.II                  | PASS                 |
| Workflow gates — ESLint + type check + build                                                                           | constitution §8                     | PASS                 |

**Constraints introduced by gates**:

- **C1**: The portal's surfaces (hero, tabs, booking flow) are built exclusively from `@foundly/ui` primitives styled with theme tokens; the existing `AdminShell` and admin views are untouched.
- **C2**: Portal logic (profile resolution, current-rate lookup, per-specialist slots) stays server-side/pure; the UI never computes availability itself.
- **C3**: No storage technology is introduced; profile/specialist/policy data lives in the in-memory seam and stays swappable.
- **C4**: All portal reads are scoped by slug and only `active` tenants expose data; the booking action re-checks conflicts at write time.
- **C5**: The booking flow is hydration-safe (client-only state) and keeps entered client data when a slot conflict occurs.

## Project Structure

### Documentation (this feature)

```text
specs/book/003-public-portal-minisite/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── portal-profile.contract.md
│   ├── portal-ui.contract.md
│   └── booking-flow.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
apps/book/
├── src/
│   ├── app/
│   │   └── [tenantSlug]/
│   │       └── page.tsx          # server page → resolves profile, renders PublicPortal/UnavailablePanel
│   ├── modules/
│   │   └── public-booking/
│   │       ├── PublicBookingView.tsx      # thin-route view → renders the portal
│   │       ├── components/
│   │       │   ├── PublicPortal.tsx       # composition + tabs/landing controller
│   │       │   ├── ProviderSections.tsx   # tabs content
│   │       │   ├── ProviderNav.tsx / ProviderSidebar.tsx
│   │       │   ├── UnavailablePanel.tsx   # existing
│   │       │   ├── ServiceCard.tsx        # card with name, description, duration, price, pill "Reservar"
│   │       │   └── RatingStars.tsx
│   │       ├── dialogs/
│   │       │   ├── BookingFlow.tsx        # @foundly/ui Modal + 4-step state machine
│   │       │   ├── SpecialistStep.tsx
│   │       │   ├── SlotStep.tsx
│   │       │   ├── ClientStep.tsx
│   │       │   └── ConfirmStep.tsx
│   │       └── utils/
│   │           ├── queries.ts        # getPublicBusiness → full profile (identity, about, contact, services+rate, specialists, hours, policies)
│   │           ├── actions.ts        # bookPublicAppointment (existing) + fetchOfferedSlots(resourceId-aware)
│   │           └── schemas.ts        # client fields (name/email/phone/notes)
│   └── shared/
│       ├── types/                    # appointments (Resource), tenancy (Tenant, PortalPolicy)
│       ├── utils/                    # format.ts (formatPrice/formatTimeLabel)
│       └── infra/                    # store.ts # extended seed: profile, specialists, policies
├── public/           # branding-logo.png, icon.png
├── next.config.mjs
└── package.json
```

**Structure Decision**: The refactor lives entirely in `apps/book`. Server data flows through `modules/public-booking/utils/queries.ts` (profile + prices + specialists + hours), the interactive booking flow is a client `Modal` (`BookingFlow`) that calls the existing action seam for slots and booking, and the whole portal is wrapped by the `@foundly/ui` theme from the root layout. The `@foundly/ui` primitives for tabs/stepper/avatar are composed locally (Button pills for tabs, Stack-circle initials for avatars) since the design system exposes no `Tabs`/`Stepper`/`Avatar` primitives (research R3/R4/R10); extending the library is deferred.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |
