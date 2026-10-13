# Implementation Plan: Foundly Book — Gallery Integration (Admin + Public Portal)

**Branch**: `013-gallery-integration` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/013-gallery-integration/spec.md`

## Summary

Replace the hard empty-state gallery with a real, backend-driven module. Add `gallery.graphql` (query + mutations) in the module, regenerate the GraphQL client via codegen, implement `actions.ts` (server reads through the session-aware transport `apiRequestAdmin` + add/remove Server Actions) and `hooks.ts` (`useFetchGallery`, `useAddGalleryItem`, `useRemoveGalleryItem`), wire `/admin/gallery` (real grid, add modal, lightbox, delete confirmation) and make the public `#galeria` block read the real gallery from `getPublicBusinessRemote`. Depends on the API surface delivered by `specs/api/012-gallery-management`.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · Next.js 15.5 (App Router, React 19) · Node ≥ 20.

**Primary Dependencies**: `graphql-request` (existing transport), `graphql-codegen` (typed documents), `@foundly/ui` (design system), `@supabase/ssr` (session), `zod` (input validation). **No new dependencies.**

**Storage**: PostgreSQL via `apps/api` over GraphQL; no direct DB access from Book.

**Testing**: Vitest + RTL + vitest-axe (unit + component); `tsc --noEmit`; `next build`; root ESLint.

**Target Platform**: Vercel multi-zone (book zone).

**Project Type**: Web application (Next.js server-first).

**Performance Goals**: initial gallery read resolved on the server (no client waterfall); no Core Web Vitals regression; images are URL-based with lazy/`objectFit` rendering.

**Constraints**: strict TS, no `any`; **Server-First** — mutations are Server Actions, the UI never calls the transport or Server Actions directly (only via `hooks.ts`); codegen-only API DTOs; RSC boundary (only serializable props to client components).

**Scale/Scope**: 1 gallery module (`actions.ts`, `hooks.ts`, `gallery.graphql`, `utils/schemas.ts`, `components/GalleryManager.tsx`, `GalleryView.tsx`, tests) + `public-booking` read + codegen snapshot; ~2–4 screens.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — `spec.md` + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec lives in `specs/book/`; changes confined to `apps/book`.
- **Capa de datos por módulo (§5.VI)** — data access in `actions.ts`; interactive mutations exposed via `hooks.ts` with `use<Acción><Entidad>` naming; UI forbidden from calling the transport/Server Actions directly.
- **Server-First (§5.II)** — the read is resolved in a Server Component; `hooks.ts` exists only for the interactive add/remove.
- **RSC boundary (§5.V / code-rules §8)** — client components receive only serializable props (gallery arrays, strings).
- **Tipado estricto (§5.IV)** — codegen-only API types; domain types in `shared/types`; no `any`.
- **Design system (§6)** — `@foundly/ui` only; accessible checks green.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/book` must pass with zero regressions.
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/book/013-gallery-integration/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification (/speckit.specify output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── gallery-ui.contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/
├── modules/gallery/
│   ├── gallery.graphql                    # Gallery query + Add/Remove mutations (codegen input)
│   ├── actions.ts                         # listGallery (apiRequestAdmin) + add/remove Server Actions
│   ├── hooks.ts                           # useFetchGallery / useAddGalleryItem / useRemoveGalleryItem
│   ├── utils/schemas.ts                   # zod input validation (URL, lengths, category)
│   ├── components/GalleryManager.tsx      # real grid + add modal + lightbox + delete confirm + empty state
│   ├── GalleryView.tsx                    # server: session tenant → listGallery
│   └── tests/                             # unit (schemas/actions) + RTL (GalleryManager)
├── modules/public-booking/actions.ts      # getPublicBusinessRemote reads the real gallery by slug
└── shared/
    ├── api/generated.ts                   # regenerated (codegen; not versioned)
    ├── api/admin-request.ts               # reused session-aware transport (012)
    ├── types/tenancy.ts                   # GalleryPhoto + category labels (existing)
    └── components/ApiErrorDialog.tsx      # reused clean error modal (012)

apps/book/codegen.schema.gql               # versioned SDL snapshot synced from the API (012)
apps/book/src/app/admin/gallery/page.tsx   # unchanged thin route rendering <GalleryView/>
```

**Structure Decision**: Canonical data module (`actions.ts`/`hooks.ts`/`components/`) per constitution §5.VI. The public read is layered onto the existing `public-booking` module (no new route). No new packages.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
