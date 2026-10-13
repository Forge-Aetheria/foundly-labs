# Implementation Plan: Foundly Book — Availability Time Blocks (Admin + Public Booking)

**Branch**: `015-availability-time-blocks` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/015-availability-time-blocks/spec.md`

## Summary

Replace the hardcoded empty `listTimeBlocks()` with a real, backend-driven module: add `timeBlocks.graphql`, regenerate codegen, implement `listTimeBlocks`/`addTimeBlock`/`removeTimeBlock` in the availability module's `actions.ts` + `hooks.ts`, wire `/admin/availability` (list real blocks, add a date/time range with an optional reason, remove with confirmation), and make the public booking flow exclude blocked intervals by feeding them into `computeAvailability`. Depends on the API surface from `specs/api/014-availability-time-blocks`.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · Next.js 15.5 (App Router, React 19) · Node ≥ 20.

**Primary Dependencies**: `graphql-request`, `graphql-codegen`, `@foundly/ui`, `@supabase/ssr`, `zod`. **No new dependencies.**

**Storage**: PostgreSQL via `apps/api` over GraphQL.

**Testing**: Vitest + RTL + vitest-axe; `tsc --noEmit`; `next build`; root ESLint.

**Target Platform**: Vercel multi-zone (book zone).

**Project Type**: Web application (Next.js server-first).

**Performance Goals**: the admin read is resolved on the server; the public slot lookup adds one bounded blocks query (no Core Web Vitals impact).

**Constraints**: strict TS, no `any`; Server-First — add/remove are Server Actions, the UI never calls the transport or Server Actions directly (only via `hooks.ts`); codegen-only API DTOs; RSC boundary (serializable props only).

**Scale/Scope**: availability module (`timeBlocks.graphql`, `actions.ts`, `hooks.ts`, `utils/schemas.ts`, `components/AvailabilityEditor.tsx`, `AvailabilityView.tsx`, tests) + the public-booking block exclusion in `fetchOfferedSlots`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/book/`; changes confined to `apps/book`.
- **Capa de datos por módulo (§5.VI)** — data access in `actions.ts`, interactive mutations exposed via `hooks.ts` (`useListTimeBlocks`, `useAddTimeBlock`, `useRemoveTimeBlock`); UI forbidden from calling the transport/Server Actions directly.
- **Server-First (§5.II)** — the admin read and weekly availability are resolved on the server; `hooks.ts` only for interactive block mutations.
- **RSC boundary (§5.V / code-rules §8)** — client components receive only serializable props.
- **Tipado estricto (§5.IV)** — codegen-only API types; domain `TimeBlock` in `shared/types`; no `any`.
- **Design system (§6)** — `@foundly/ui` only; accessible checks green.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/book` with zero regressions.
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/book/015-availability-time-blocks/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── availability-blocks-ui.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/modules/availability/
├── timeBlocks.graphql                 # TimeBlocks query + Add/Remove mutations (codegen input)
├── actions.ts                         # listTimeBlocks (apiRequestAdmin) + addTimeBlock/removeTimeBlock Server Actions
├── hooks.ts                           # + useListTimeBlocks / useAddTimeBlock / useRemoveTimeBlock
├── utils/schemas.ts                   # + timeBlockSchema (date/time/reason)
├── components/AvailabilityEditor.tsx  # real blocks list + add form + remove confirmation
├── AvailabilityView.tsx               # server: tenant from session → listAvailabilityRules + listTimeBlocks
└── tests/                             # unit + RTL
apps/book/src/modules/public-booking/actions.ts   # fetchOfferedSlots maps blocks into computeAvailability
apps/book/codegen.schema.gql                       # versioned SDL snapshot (from API 014)
```

**Structure Decision**: Canonical data module (availability already hosts the weekly rules; blocks are added to the same module). The public exclusion is layered into the existing `fetchOfferedSlots`. No new packages.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
