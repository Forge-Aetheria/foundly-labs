---
description: 'Task list for the Foundly Book brand canvas & visual coherence feature'
---

# Tasks: Foundly Book — Brand Canvas & Visual Coherence

**Input**: Design documents from `specs/book/004-book-brand-canvas/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, contracts/brand-canvas.contract.md

**Tests**: INCLUDED — `quickstart.md` defines the module validation suite (tests, build, typecheck, lint, manual visual checks).

**Organization**: Tasks are grouped by concern (canvas foundation → shared primitives → surface replica →
validation). All tasks below are **complete (executed)** and record the change as it landed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

The canvas lives in `apps/book/src/app/globals.css` and is applied by `apps/book/src/app/layout.tsx`;
shared primitives that enable the replica live in `packages/ui/src/components/{Card,Button}`.

---

## Phase 1: Canvas foundation

**Purpose**: Establish the single source of truth for the module's background identity, **mirroring the
Astro landing exactly** (design canon).

- [x] T001 [P] [US1] Create `apps/book/src/app/globals.css` with the book-local gradient extension
      (`--book-gradient-from`/`--book-gradient-to`) and the `.book-app-canvas` class (min-height 100vh,
      full width, `--bg-app-body` fallback, continuous lavender gradient, `no-repeat`,
      `background-attachment: fixed`) per `contracts/brand-canvas.contract.md`.
- [x] T002 [US1] Wire the canvas in `apps/book/src/app/layout.tsx`: import `./globals.css` and set
      `className="book-app-canvas"` on `<body>` so `/`, `/onboarding`, `/admin/*` and `/[tenantSlug]`
      inherit it (FR-001).

---

## Phase 2: Canonical sync (Option 1 — book replicates the landing)

**Purpose**: Replace the softer draft gradient with the landing's exact `#C8B6FF → #D8B4FE` identity and
add the glass tokens the replica needs.

- [x] T008 [P] [US1] Sync `apps/book/src/app/globals.css` tokens to the landing: `--book-gradient-from:
      #c8b6ff`, `--book-gradient-to: #d8b4fe`, canvas composed like `apps/landing/src/styles/global.css`
      (`linear-gradient(180deg, from 0%, card-light 60%)`); add `--book-glass` (70% white) and
      `--book-glass-card` (60% white) mirroring `bg-card-light/70` and `/60` (FR-002).
- [x] T009 [P] [US2/US3] Extend shared primitives additively so the replica can override surfaces without
      changing defaults: `Card` and `Button` accept an optional `sx?: SxProps<Theme>`
      (`packages/ui/src/components/Card/Card.tsx`, `Button.tsx`) with forwarding tests
      (`Card.test.tsx`, `Button.test.tsx`).

---

## Phase 3: Landing replica & surface coherence

**Purpose**: Make the product page look like the Astro landing and let the canvas show through the wrappers.

- [x] T003 [P] [US2] Product page `apps/book/src/app/components/ProductLanding.tsx`: remove the opaque
      wrapper `backgroundColor`, turn the sticky header into glass at 70% (`--book-glass` + blur(12px) +
      subtle border, mirroring the landing navbar), and drop the hero's own background + `borderBottom`
      divider (FR-003/FR-004/FR-005).
- [x] T010 [P] [US3] Product page replica detail: hero pill + category pills use `surface.badgePill` +
      `primary.main`; primary buttons use `primary.main` + `shadow.card` + 90% hover; secondary buttons
      use `--book-glass-card` + blur + subtle border + `badgePill` hover (FR-008); showcase/benefits
      cards use `--book-glass-card` + blur glassmorphism via the new `Card` `sx` prop (FR-006).
- [x] T004 [P] [US4] Admin shell `apps/book/src/app/admin/components/AdminShell.tsx`: remove the opaque
      `backgroundColor: 'background.default'` full-screen layer so the canvas shows behind the routed
      screens, keeping the white sidebar as an intentional panel (FR-005).
- [x] T011 [P] [US3] Centralise the canon overrides in `apps/book/src/app/components/landingCanon.ts`
      (`PRIMARY_BUTTON_SX`, `SECONDARY_BUTTON_SX`, `GLASS_CARD_SX`, `PILL_SX`) and reuse them from the
      product page (`/`) and the guided booking checkout (`/[tenantSlug]` modal + steps), using the
      `@foundly/ui` `Modal` `glass` surface (FR-006/FR-008).

---

## Phase 4: Validation

**Purpose**: Prove the canvas change is green and does not regress the module or the shared package.

- [x] T005 Run the module validation per `quickstart.md`: `npm run test -w @foundly/book` (92/92),
      `npm run test -w @foundly/ui` (28/28), `npm run build -w @foundly/book`,
      `npm run typecheck` + `npm run lint` for both workspaces.
- [x] T006 Keep shared values untouched: confirm `@foundly/ui` token values and `specs/system-design.md`
      have no value diff (only the additive `sx` prop on `Card`/`Button`).
- [x] T007 Keep the cross-referencing book specs (`001-book-admin-panel`, `002-onboarding-and-tenant-flow`,
      `003-public-portal-minisite`) referencing the module's brand canvas instead of duplicating the rule
      (`constitution.md` §2.III).

---

## Dependencies & Execution Order

- **Phase 1 (canvas foundation)**: No dependencies — the canvas exists without surface changes.
- **Phase 2 (canonical sync)**: Depends on Phase 1; re-aligns token values and adds glass tokens.
- **Phase 3 (replica + coherence)**: Depends on Phases 1–2 and T009 (the `sx` props enable the replica).
- **Phase 4 (validation + docs)**: Depends on Phases 1–3.

### Parallel Opportunities

- T001 and T002 run in parallel; T008 (token sync) and T009 (shared `sx`) are independent of each other
  after T002.
- T003/T010/T004 (surface replica) run in parallel once T009 is in (they consume `sx`/glass tokens).
- T006 and T007 are independent and can run in parallel with the validation command.

## Notes

- Presentation-layer only: no store, action, route or shared token **value** was modified; `@foundly/ui`
  `Card`/`Button` only gained an additive `sx` prop.
- `background-attachment: fixed` guarantees the canvas covers the full viewport; fallbacks keep the
  `--bg-app-body` identity (documented in `contracts/brand-canvas.contract.md`).