# Implementation Plan: Foundly Book — Staff Management

**Branch**: `005-staff-management` | **Date**: 2026-10-10 | **Spec**: `specs/book/005-staff-management/spec.md`

**Input**: Feature specification from `/specs/book/005-staff-management/spec.md`

## Summary

Turn `/admin/staff` into "Equipo y Especialistas": a glassmorphism card grid of the tenant's
professionals with service badges, status, and per-card actions; a create/edit modal (name, role,
bio ≤250, avatar preview, services multi-select, active switch); validation (name/role required,
warning on zero services); and same-seam synchronization so `getPublicBusiness(slug)` reflects every
change on the public portal. Reuses the existing storefront feature module and adds two `@foundly/ui`
primitives (Switch, Checkbox) plus `TextField` multiline/maxLength support.

## Technical Context

**Language/Version**: TypeScript 5.9 · React 19 · Next.js 15.5 (App Router)

**Primary Dependencies**: `@foundly/ui` (design system) · MUI v6 (as engine of `@foundly/ui`) · Zod 4

**Storage**: None — in-memory seam `apps/book/src/server/store.ts`

**Testing**: Vitest + RTL + vitest-axe (`npm run test -w @foundly/book`)

**Target Platform**: Web (Next.js server components + client islands)

**Project Type**: Web application (monorepo workspace)

**Performance Goals**: N/A (small admin surfaces)

**Constraints**: C1 — views use `@foundly/ui` only; C2 — `apps/book/src/domain` stays free of
React/Next/MUI/storage imports; C3 — persistence only through the store seam.

**Scale/Scope**: single-screen admin feature; ~1 grid view + 1 modal + data-model tweak.

## Constitution Check

*GATE: must pass before implementation.*

- Specs live under `/specs/<dominio>/<nnn>-<feature>/` → **OK** (`book/005-staff-management`).
- Views consume `@foundly/ui` + tokens, no hex literals → **OK** (pill `#6C5CE7` expressed as `primary.main`).
- Domain logic pure → **OK** (`Resource.serviceIds` is a plain field; assignment validated in actions).
- Persistence not defined → **OK** (mutations go through the store seam only).

## Project Structure

### Documentation (this feature)

```text
specs/book/005-staff-management/
├── plan.md              # This file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-staff.contract.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/ui/src/components/
├── Switch/               # NEW primitive (@foundly/ui)
├── Checkbox/             # NEW primitive (@foundly/ui)
└── TextField/            # EXTEND: multiline, rows, maxLength

apps/book/src/domain/appointments/types.ts   # EXTEND: Resource.serviceIds?
apps/book/src/server/store.ts                # EXTEND: seed serviceIds
apps/book/src/features/storefront/
├── schemas.ts            # EXTEND: serviceIds
├── actions.ts            # EXTEND: createStaff/updateStaff serviceIds
└── components/StaffManager.tsx  # REWRITE: card grid + rich modal
apps/book/src/features/public-booking/
├── types.ts              # EXTEND: PublicSpecialist.services
├── queries.ts            # EXTEND: map services
└── components/provider/ProviderSections.tsx  # TeamSection services badges
specs/book/005-staff-management/  # feature docs (this feature)
```

**Structure Decision**: Feature docs live in the domain spec folder; the implementation reuses the
existing `storefront` feature module under `apps/book/src/features/` (no new app/package).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Two new shared primitives (Switch, Checkbox) in `@foundly/ui` | The DS lacks form-control primitives; the spec demands a switch + multi-select using `@foundly/ui` only | Using raw MUI in the admin view would violate C1/FR-009 |