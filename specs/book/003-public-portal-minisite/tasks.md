---
description: 'Task list for the Foundly Book public portal mini-site feature'
---

# Tasks: Foundly Book — Public Portal Mini-Site (Setmore-style)

**Input**: Design documents from `specs/book/003-public-portal-minisite/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: INCLUDED — the spec requires an accessible, responsive mini-site (SC-005/SC-007) and `quickstart.md` defines a Vitest/RTL + `vitest-axe` suite.

**Organization**: Tasks are grouped by user story (US1–US4) to enable independent implementation and testing. Persistence stays **undefined**: portal profile, specialists and policies live in the in-memory store seam; no storage technology may be introduced.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

Single location: `apps/book/`. Portal code lives under `src/features/public-booking/`; the route under `src/app/[tenantSlug]/` per `plan.md`.

---

## Phase 1: Setup

**Purpose**: Prepare the portal's shared types and formatting helpers.

- [x] T001 [P] Create the portal DTO barrel `apps/book/src/features/public-booking/types.ts` exporting `PublicService`, `PublicSpecialist`, `PublicBusinessProfile` and `PortalPolicyView` (leafy, serializable types per `contracts/portal-profile.contract.md`).
- [x] T002 [P] Add formatting helpers `formatPrice(amountCents, currency)` (Intl es-ES currency) and `formatTimeLabel(iso)` in `apps/book/src/features/public-booking/format.ts` (used by service cards and slot labels).

---

## Phase 2: Foundational

**Purpose**: Data model, portal profile query, per-specialist slots and client-field schemas that MUST be complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Extend `Resource` in `apps/book/src/domain/appointments/types.ts` with optional `role: string | null`, `avatar: string | null` and `bio: string | null` (per `data-model.md` §3, constraint: "bio optional, max 500 chars").
- [x] T004 [P] Extend `Tenant` in `apps/book/src/domain/tenancy/types.ts` with `bio`, `address`, `phone`, `cover`, `social` (`{ instagram?: string; whatsapp?: string } | null`) and add `PortalPolicy { id, title, body }` (constraints from `data-model.md` §1–§2: `bio` max 2000, `address` max 200, `phone` max 30, all `null` by default; `PortalPolicy.title` 1–120 chars, `body` 1–2000).
- [x] T005 [P] Seed the store `apps/book/src/server/store.ts` with the demo tenant's full profile (bio, address, phone, cover, social), **two active specialists** (resources `res-ana` + a new one, each with `role`/`avatar`/`bio`) and **two `PortalPolicy` entries** (booking + cancellation). Rule: "only `active` resources are listed as specialists".
- [x] T006 [P] Refactor `getOfferedSlots`/`fetchOfferedSlots` in `apps/book/src/features/public-booking/queries.ts` + `actions.ts` to accept an optional `resourceId` (default: the tenant's first resource) so slots are scoped per specialist (research R5).
- [x] T007 [P] Extend `getPublicBusiness` in `apps/book/src/features/public-booking/queries.ts` to return `PublicBusinessProfile` (identity, about, contact, services with current `Rate`, active-only specialists, `weeklyHours`, `policies`) per `contracts/portal-profile.contract.md` (FR-016).
- [x] T008 [P] Create client-field schemas in `apps/book/src/features/public-booking/schemas.ts` per `contracts/booking-flow.contract.md` (verbatim: `name` required 1–120; `email` required valid format; `phone` required 8–20 chars digits/spaces/+/-; `notes` optional max 2000).
- [x] T009 [P] Write portal-profile tests in `apps/book/src/features/public-booking/queries.test.ts`: active tenant resolves the full profile; draft/suspended/unknown resolve `unavailable` with zero data; price is the current rate; only active specialists listed (contracts/portal-profile.contract.md).
- [x] T010 [P] Write specialist-slot tests in `apps/book/src/features/public-booking/queries.test.ts`: `getOfferedSlots` with `resourceId` returns only that specialist's availability and excludes the other's blocks/appointments.

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Explore the branded mini-site (Priority: P1) 🎯 MVP

**Goal**: An informative storefront: brand hero (identidad, "Sobre nosotros", contacto), accessible tabs with 'Servicios' as default and priced service cards.

**Independent Test**: Open an active tenant page and confirm cover/avatar/name/category/badges/bio/contact render plus the default 'Servicios' tab with priced cards; unknown/inactive tenants render only the unavailable state.

### Tests for User Story 1 (write FIRST, ensure they FAIL before implementation)

- [x] T011 [P] [US1] `BrandHero` test `apps/book/src/features/public-booking/components/BrandHero.test.tsx`: cover, avatar/logo, name, category, badges, bio and contact render; fields omitted when `null`; `vitest-axe` clean.
- [x] T012 [P] [US1] Portal tabs test `apps/book/src/features/public-booking/components/PublicPortal.test.tsx`: 'Servicios' is the default tab and `ServiceCard`s show name, duration and price with a pill "Reservar"; `vitest-axe` clean.

### Implementation for User Story 1

- [x] T013 [P] [US1] Build `BrandHero.tsx` in `apps/book/src/features/public-booking/components/` (lavender cover band `primary.light`, avatar with initials-circle fallback, identity + badges, bio section, contact row: address/phone/Instagram/WhatsApp https anchors) per `contracts/portal-ui.contract.md` (FR-001…FR-004).
- [x] T014 [P] [US1] Build the accessible tab controller `PortalTabs.tsx` (`Button` pills, `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, arrow-key navigation) per `contracts/portal-ui.contract.md` (FR-005).
- [x] T015 [P] [US1] Build `ServiceCard.tsx` in `apps/book/src/features/public-booking/components/` (Card: name, description if present, `durationMinutes`, price via `formatPrice`, pill "Reservar" wired to open the booking flow) per FR-006/FR-017.
- [x] T016 [US1] Rewrite `PublicPortal.tsx` composition: `BrandHero` + `PortalTabs` with 'Servicios' default rendering the `ServiceCard` list; keep `UnavailablePanel` for non-active tenants (depends on T013–T015).
- [x] T017 [US1] Rewire `apps/book/src/app/[tenantSlug]/page.tsx` to pass the full `PublicBusinessProfile` to `PublicPortal`.
- [x] T018 [US1] Remove the superseded components (`BookingPanel.tsx`, `BookingPanel.test.tsx`, `ServiceList.tsx`, `TenantPublicHeader.tsx`) from `apps/book/src/features/public-booking/components/`.

**Checkpoint**: User Story 1 functional (storefront mini-site) and independently testable (MVP).

---

## Phase 4: User Story 2 - Book a service in a guided flow (Priority: P1)

**Goal**: A 4-step booking flow (`@foundly/ui` `Modal`): specialist → date/slots → client data → confirmation, creating the "online" appointment.

**Independent Test**: From a service card, walk the flow selecting a specialist, a slot, valid client data and confirm; a conflict keeps the entered data and offers remaining slots.

### Tests for User Story 2 (write FIRST)

- [x] T019 [P] [US2] Booking flow test `apps/book/src/features/public-booking/components/booking/BookingFlow.test.tsx`: 4 steps, specialist step skipped with a single specialist, slots from mocked `fetchOfferedSlots`, invalid email/phone block progression, `CONFLICT` keeps client data.
- [x] T020 [P] [US2] Client schema tests `apps/book/src/features/public-booking/schemas.test.ts` per `contracts/booking-flow.contract.md` (name/email/phone/notes rules).
- [x] T021 [P] [US2] Action tests in `apps/book/src/features/public-booking/actions.test.ts`: booking with `resourceId` creates `origin: 'online'` + `pending`; an overlapping booking returns `CONFLICT`.

### Implementation for User Story 2

- [x] T022 [P] [US2] Build `booking/SpecialistStep.tsx` (pill buttons of active specialists; when fewer than two active specialists the step is skipped, FR-010).
- [x] T023 [P] [US2] Build `booking/SlotStep.tsx` (interactive date selector + time-slot grid fed by `fetchOfferedSlots({ tenantSlug, serviceId, resourceId, startDate, endDate })`, FR-011).
- [x] T024 [P] [US2] Build `booking/ClientStep.tsx` (name/email/phone/notes fields validated with `schemas.ts`, inline errors, FR-012).
- [x] T025 [P] [US2] Build `booking/ConfirmStep.tsx` (summary card: service, specialist, date+time, client data + confirm, FR-013).
- [x] T026 [US2] Build `booking/BookingFlow.tsx`: `@foundly/ui` `Modal` + 4-step state machine; calls `bookPublicAppointment`; on `CONFLICT` keeps the entered data and surfaces remaining slots (FR-014/FR-015; depends on T022–T025).
- [x] T027 [US2] Wire the "Reservar" pill in `ServiceCard.tsx` to open `BookingFlow` with the service preselected.

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Meet the team and the policies (Priority: P2)

**Goal**: 'Equipo / Especialistas' and 'Información & Políticas' tabs render the specialists, weekly hours and policies.

**Independent Test**: Open both tabs and confirm specialists (initials avatar + role) and the schedule + policies read correctly; empty states when no specialists/policies.

### Tests for User Story 3 (write FIRST)

- [x] T028 [P] [US3] `SpecialistsTab.test.tsx`: specialists with initials + roles render; empty state when none; `vitest-axe` clean (FR-007).
- [x] T029 [P] [US3] `PoliciesTab.test.tsx`: weekly hours per weekday and policy list render; fallback copy when empty; `vitest-axe` clean (FR-008).

### Implementation for User Story 3

- [x] T030 [P] [US3] Build `SpecialistsTab.tsx` in `apps/book/src/features/public-booking/components/` (active specialists, initials avatar, name, role; empty state).
- [x] T031 [P] [US3] Build `PoliciesTab.tsx` (weekly `businessHours` per weekday + `PortalPolicy` list with fallback copy "Consulta las condiciones con el negocio").
- [x] T032 [US3] Register both tabs in `PortalTabs.tsx`/`PublicPortal.tsx` (accessibility per `contracts/portal-ui.contract.md`).
- [x] T033 [US3] Extend/verify the seeded demo tenant so specialists and policies are present for the manual scenarios in `quickstart.md`.

**Checkpoint**: User Stories 1–3 all work independently.

---

## Phase 6: User Story 4 - Responsive and accessible mini-site (Priority: P2)

**Goal**: The whole mini-site is keyboard-operable, has zero critical a11y violations and no horizontal overflow on mobile.

**Independent Test**: Keyboard traversal of the tabs and the booking flow on a mobile viewport with no overflow and zero `vitest-axe` violations.

### Tests for User Story 4 (write FIRST)

- [x] T034 [P] [US4] Full-portal accessibility test in `apps/book/src/features/public-booking/components/PublicPortal.test.tsx`: tabs implement `tablist`/`tab`/`tabpanel` semantics, focus is visible and `vitest-axe` reports zero critical violations (FR-019, SC-005).
- [x] T035 [P] [US4] Responsive-structure test (`PublicPortal.test.tsx`): grids collapse to one column on `xs` (`gridTemplateColumns: { xs: '1fr' }`) and rows use `flexWrap`; assert no `100vw`/fixed-width indicators remain (FR-020, SC-007).

### Implementation for User Story 4

- [x] T036 [US4] Finalize portal a11y details: `aria-controls`/`aria-labelledby` wiring, focus management when the booking `Modal` opens, and `aria-live` status for the flow (FR-019).
- [x] T037 [US4] Finalize responsive polish: fluid hero cover, `flexWrap` rows for tabs/slots/contact, single-column grids on mobile, `overflow: hidden` on decorative bands (FR-020).

**Checkpoint**: All user stories independently functional; portal is accessible and responsive.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T038 [P] Document the mini-site in `apps/book/README.md` (public portal: hero, tabs, booking flow, seeded profile/specialists/policies).
- [x] T039 [P] Add a shared-ui roadmap note in `specs/shared-ui/001-ui-component-library/tasks.md` mentioning potential `Tabs`, `Stepper` and `Avatar` primitives (research R10/R3/R4).
- [x] T040 Run the `quickstart.md` validation: `npm run test -w @foundly/book`, `npm run lint`, `npm run build -w @foundly/book` all green.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational completion; proceed in priority order (US1 → US2 → US3 → US4).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependencies (**MVP**).
- **US2 (P1)**: After Foundational + US1 (needs service cards + the flow wiring).
- **US3 (P2)**: After Foundational — needs the tabs controller from US1 to register its tabs.
- **US4 (P2)**: After US1–US3 — audits every surface.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Types/DTOs before queries; queries before components; components before page wiring.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Setup tasks T001–T002 run in parallel.
- Foundational tasks T004–T010 run in parallel after T003.
- US1 test tasks (T011–T012) run in parallel; component tasks T013–T015 run in parallel before T016.
- US2 step components (T022–T025) run in parallel before T026.
- US4 test tasks (T034–T035) run in parallel.

---

## Parallel Example: User Story 1

```text
# Launch all fail-first tests together:
Task: "T011 BrandHero test  - components/BrandHero.test.tsx"
Task: "T012 Portal tabs test - components/PublicPortal.test.tsx"

# Launch the three building blocks together:
Task: "T013 Build BrandHero   (components/BrandHero.tsx)"
Task: "T014 Build PortalTabs  (components/PortalTabs.tsx)"
Task: "T015 Build ServiceCard  (components/ServiceCard.tsx)"
```

---

## Phase 8: Provider landing (two-column) — EXECUTED addendum (2026-10-10)

**Purpose**: Replace the tab storefront with the full two-column provider landing and seed a rich test
business. Supersedes the tab-based shell (BrandHero/PortalTabs/SpecialistsTab/PoliciesTab were removed).

- [x] T040 [P] Extend tenancy types: `Tenant.gallery?: string[]` and the `Review` entity
      (`apps/book/src/domain/tenancy/types.ts`).
- [x] T041 [P] Seed the `rona-piercing` business in `apps/book/src/server/store.ts`: identity + gallery
      (Unsplash URLs), 6 services in 3 categories with rates, 3 specialists with avatar/bio, business
      hours, 3 policies and 5 reviews; the store gains a `reviews` collection (resetStore included).
- [x] T042 [P] Extend the public profile: `PublicService.category`, `PublicReview` and
      `gallery`/`rating`/`reviewCount`/`reviews` on `PublicBusinessProfile`
      (`apps/book/src/features/public-booking/types.ts`) and compute them in `queries.ts`
      (rating = averaged/round-1; reviews newest first).
- [x] T043 [P] Build the provider components under
      `apps/book/src/features/public-booking/components/provider/`: `RatingStars`, `ProviderNav`
      (anchor pills), `ProviderSidebar` (sticky: brand, rating, Reservar `#6C5CE7`, hours `<details>`,
      contact) and `ProviderSections` (banner, policies, catalog by category, team, about, gallery,
      reviews, direction).
- [x] T044 [P] Rewrite `PublicPortal` as the two-column orchestration (nav + main + sticky sidebar +
      BookingFlow modal) with responsive order (sidebar compact header on mobile).
- [x] T045 [P] Remove the superseded tab components and their tests (BrandHero, PortalTabs,
      SpecialistsTab, PoliciesTab) and rewrite `PublicPortal.test.tsx` for the new landing
      (nav, sections, sidebar Reservar opening the checkout, a11y).
- [x] T046 Run validation: `npm run test -w @foundly/book` (86/86), `npm run build -w @foundly/book`,
      `npm run typecheck` + `npm run lint -w @foundly/book` all green; update this addendum and the
      contracts (`portal-profile`, `portal-ui`).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1 (storefront mini-site).
4. **STOP and VALIDATE**: `npm run test -w @foundly/book` + manual `/estudio-ana` review.
5. Demo the mini-site storefront.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → validate → demo (MVP: storefront).
3. US2 → booking flow → validate.
4. US3 → team & policies tabs → validate.
5. US4 → accessibility/responsive hard pass → validate.
6. Polish → `quickstart.md` end-to-end.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. US1 (storefront) is the critical path; after it, US2 (flow) and US3 (tabs content) can be split.
3. US4 audits all surfaces once the others land.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps each task to its user story for traceability.
- Each user story is independently completable and testable.
- Verify tests fail before implementing.
- Commit after each task or logical group.
- Persistence is NOT defined: profile/specialists/policies go through the store seam; no storage technology may be added.
- `contracts/booking-flow.contract.md`, `contracts/portal-profile.contract.md` and `contracts/portal-ui.contract.md` are normative for constraints (quote them verbatim when in doubt).