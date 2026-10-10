---
description: 'Task list for the Foundly Book brand canvas & visual coherence feature'
---

# Tasks: Foundly Book — Brand Canvas & Visual Coherence

**Input**: Design documents from `specs/book/004-book-brand-canvas/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, contracts/brand-canvas.contract.md

**Tests**: INCLUDED — `quickstart.md` defines the module validation suite (tests, build, typecheck, lint, manual visual checks).

**Organization**: Tasks are grouped by concern (canvas foundation → surfaces → validation). All tasks below are
**complete (executed)** and record the change as it landed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

Single location: `apps/book/`. The canvas lives in `src/app/globals.css` and is applied by
`src/app/layout.tsx`; view-level edits remove opaque backgrounds.

---

## Phase 1: Canvas foundation

**Purpose**: Establish the single source of truth for the module's background identity.

- [x] T001 [P] [US1] Create `apps/book/src/app/globals.css` with the book-local gradient extension
      (`--book-gradient-from`, `--book-gradient-mid`, `--book-gradient-to`) and the `.book-app-canvas`
      class (min-height 100vh, full width, `--bg-app-body` fallback, continuous lavender gradient,
      `no-repeat`, `background-attachment: fixed`) per `contracts/brand-canvas.contract.md`.
- [x] T002 [US1] Wire the canvas in `apps/book/src/app/layout.tsx`: import `./globals.css` and set
      `className="book-app-canvas"` on `<body>` so `/`, `/onboarding`, `/admin/*` and `/[tenantSlug]`
      inherit it (FR-001).

---

## Phase 2: Surface coherence

**Purpose**: Remove the opaque layers and hard cuts so the root canvas shows continuously.

- [x] T003 [P] [US2] Product page `apps/book/src/app/components/ProductLanding.tsx`: remove the opaque
      wrapper `backgroundColor`, turn the sticky header into the glass surface (`surface.glass` +
      backdrop blur, mirroring the landing Navbar), and drop the hero's own background + `borderBottom`
      divider (FR-003/FR-004/FR-005).
- [x] T004 [P] [US4] Admin shell `apps/book/src/app/admin/components/AdminShell.tsx`: remove the opaque
      `backgroundColor: 'background.default'` full-screen layer so the canvas shows behind the routed
      screens, keeping the white sidebar as an intentional panel (FR-005).

---

## Phase 3: Validation

**Purpose**: Prove the canvas change is green and does not regress the module.

- [x] T005 Run the module validation per `quickstart.md`: `npm run test -w @foundly/book` (92/92),
      `npm run build -w @foundly/book`, `npm run typecheck -w @foundly/book`, `npm run lint -w @foundly/book`.
- [x] T006 [P] Keep the shared layer untouched: confirm `@foundly/ui` and `specs/system-design.md` have no diff.
- [x] T007 Update the cross-referencing book specs (`001-book-admin-panel`, `002-onboarding-and-tenant-flow`,
      `003-public-portal-minisite`) to reference the module's brand canvas instead of duplicating the rule
      (`constitution.md` §2.III).

---

## Dependencies & Execution Order

- **Phase 1 (canvas foundation)**: No dependencies — the canvas exists without surface changes.
- **Phase 2 (surface coherence)**: Depends on Phase 1; the new root canvas is what the surface edits expose.
- **Phase 3 (validation + docs)**: Depends on Phases 1–2.

### Parallel Opportunities

- T001 and T003/T004 touch different files but T002 (layout) is the seam between them; T003/T004 run in
  parallel after T002.
- T006 and T007 are independent and can run in parallel with the validation command.

## Notes

- Presentation-layer only: no store, action, route or shared token was modified.
- `background-attachment: fixed` guarantees the canvas covers the full viewport; rural/mobile fallbacks
  keep the `--bg-app-body` identity (documented in `contracts/brand-canvas.contract.md`).