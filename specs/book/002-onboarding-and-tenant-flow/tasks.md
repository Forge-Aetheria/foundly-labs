---
description: 'Task list for the Foundly Book onboarding & tenant flow feature'
---

# Tasks: Foundly Book — Business Onboarding & Tenant Flow

**Input**: Design documents from `specs/book/002-onboarding-and-tenant-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: INCLUDED — the spec requires accessible, isolated surfaces (SC-007, SC-008) and `quickstart.md` defines a Vitest/RTL validation suite (tenancy, onboarding, routes, public-booking).

**Organization**: Tasks are grouped by user story (US1–US4) to enable independent implementation and testing. Persistence stays **undefined**: all data lives in the in-memory store seam (`apps/book/src/shared/infra/store.ts`); no storage technology may be introduced.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

Single location: `apps/book/`. New surfaces live under thin `src/app/` routes, with logic in domain modules (`src/modules/<modulo>/`) and shared code (`src/shared/`) per `plan.md`.

---

## Phase 1: Setup

**Purpose**: Prepare the route structure so `/`, `/onboarding`, `/admin/*` and `/[tenantSlug]` are the four surfaces (public URLs via the `/book` multi-zone prefix).

- [x] T001 Create the tenancy domain folder `apps/book/src/shared/` with placeholder `types.ts`, `slug.ts` and `provision.ts` per `plan.md`.
- [x] T002 [P] Relocate the private dashboard from `apps/book/src/app/(admin)/` to `apps/book/src/app/admin/` (move `layout.tsx`, `components/` and the `agenda`, `services`, `availability`, `configuracion`, `soporte`, `acerca` pages), so the authenticated surface is served at `/admin/*`; update internal links in `AdminShell.tsx` and `navigation.ts` accordingly (`contracts/routes.contract.md`).
- [x] T003 [P] Replace the unconditional redirect in `apps/book/src/app/page.tsx` with a minimal placeholder page; the post-auth redirect target becomes `/admin/agenda` (enforced by the guard in T029).

---

## Phase 2: Foundational

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create tenancy types `apps/book/src/shared/types/tenancy.ts` per `contracts/tenancy.contract.md`: `Tenant`, `User`, `BusinessHours`, `Session`, `TenantStatus` (`draft | active | suspended`), `UserRole` (`owner | professional`), `TenantLicense`, `BookingDraft`. Enforce verbatim: "`Tenant.slug` MUST be unique, valid and not reserved; `Tenant.ownerUserId` MUST reference the owning user", "`User.email` MUST be unique and well-formed", "`BusinessHours.endTime` MUST be strictly after `startTime` when `isOpen` is true", "`defaultAppointmentDurationMinutes` MUST be `> 0`".
- [x] T005 [P] Implement the pure slug module `apps/book/src/shared/utils/slug.ts`: `normalizeSlug`, `validateSlug` (returns `{ ok: true }` or `{ ok: false, reason: 'format' | 'reserved' | 'taken' }`), `RESERVED_SLUGS` (`admin`, `onboarding`, `api`, `www`, `app`, `public`, `static`, `assets`) and `suggestSlug`. Enforce the format `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` (3–40 chars).
- [x] T006 [P] Extend the store seam `apps/book/src/shared/infra/store.ts` with `tenants`, `users` and `sessions` collections (plain typed arrays per `data-model.md`), enforced uniqueness of `Tenant.slug` and `User.email` at write time, `getStore`/`resetStore` support, and a seeded sample `active` tenant + owner for development.
- [x] T007 [P] Add the tenant guard to `apps/book/src/shared/infra/auth.ts`: `requireTenant(session)` returning `UNAUTHENTICATED` / `FORBIDDEN` per `contracts/routes.contract.md`, deriving `tenantId` from the session (never from the URL).
- [x] T008 [P] Implement tenant queries `apps/book/src/shared/tenancy/queries.ts`: `getTenantBySlug(slug)` and `getCurrentTenant(session)`, honouring the status table in `data-model.md` §6 (only `active` tenants are portal-visible).
- [x] T009 [P] Write tenancy unit tests `apps/book/src/shared/utils/slug.test.ts` and `apps/book/src/shared/types/tenancy.test.ts` (slug format, reserved words, uniqueness, invariants from `contracts/tenancy.contract.md`).

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Register a business through the onboarding wizard (Priority: P1) 🎯 MVP

**Goal**: A three-step wizard (`/onboarding`) creates a business and its owner account and provisions the initial configuration (default duration, business hours).

**Independent Test**: Complete the wizard with valid data, confirm the tenant + owner are created exactly once and the defaults are provisioned, then land on `/admin/agenda`.

### Tests for User Story 1 (write FIRST, ensure they FAIL before implementation)

- [x] T010 [P] [US1] Zod schema tests `apps/book/src/modules/onboarding/tests/schemas.test.ts`: account (valid email, password ≥ 8 chars with letters + numbers), business (slug format/reserved), setup (`defaultAppointmentDurationMinutes > 0`, `endTime > startTime`), per `contracts/onboarding.contract.md`.
- [x] T011 [P] [US1] Draft seam tests `apps/book/src/modules/onboarding/tests/draft.test.ts`: `loadDraft`/`saveDraft`/`clearDraft` survive a simulated reload and a cleared draft returns `null`.
- [x] T012 [P] [US1] Action tests `apps/book/src/modules/onboarding/tests/actions.test.ts`: `EMAIL_TAKEN` for a registered email, `SLUG_TAKEN` for an existing slug, idempotent retry per `draftId` never creates a second tenant, and success provisions tenant (status `active`) + owner + defaults.
- [x] T013 [P] [US1] Wizard component tests `apps/book/src/modules/onboarding/tests/WizardShell.test.tsx`: three ordered steps, inline errors block progression, back/forward preserves data, `vitest-axe` clean (SC-007).

### Implementation for User Story 1

- [x] T014 [P] [US1] Create Zod schemas `apps/book/src/modules/onboarding/utils/schemas.ts` for `AccountFields`, `BusinessFields` and `SetupFields` per `contracts/onboarding.contract.md`.
- [x] T015 [P] [US1] Create the local draft seam `apps/book/src/modules/onboarding/utils/draft.ts` (`loadDraft`, `saveDraft`, `clearDraft`, `BookingDraft` type), consumed once on submit (idempotency token).
- [x] T016 [P] [US1] Create the pure provisioning module `apps/book/src/shared/utils/provision.ts` mapping setup values → a default `AvailabilityRule` set (one rule per open weekday with the general interval) plus one default `Service` (duration = `defaultAppointmentDurationMinutes`), per `data-model.md` "Relationship to 001".
- [x] T017 [US1] Implement `validateSlug` and `createBusiness` server actions in `apps/book/src/modules/onboarding/utils/actions.ts` (depends on T014–T016): validate all fields, enforce unique email/slug, provision via `provision.ts`, write tenant + user + defaults through the store seam, and return `{ tenantId, redirectTo: '/admin/agenda' }`.
- [x] T018 [US1] Build the wizard step components `AccountStep`, `BusinessStep` (with live slug feedback via `suggestSlug` and `validateSlug`) and `SetupStep` in `apps/book/src/modules/onboarding/components/`, composed exclusively from `@foundly/ui` primitives.
- [x] T019 [US1] Build `WizardShell` (step state, next/back, final submit) in `apps/book/src/modules/onboarding/components/` and wire `apps/book/src/app/onboarding/page.tsx` to render it and redirect to `/admin/agenda` on success.

**Checkpoint**: User Story 1 functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Book an appointment on a business's public page (Priority: P2)

**Goal**: The public portal `/[tenantSlug]` shows an active business and lets a guest book an available slot.

**Independent Test**: Open `/<slug>` of an active business, book a free slot as a guest, and confirm the appointment appears in the dashboard with `origin: 'online'`.

### Tests for User Story 2 (write FIRST)

- [x] T020 [P] [US2] Portal query tests `apps/book/src/modules/public-booking/tests/queries.test.ts`: active tenant resolves, `draft`/`suspended`/unknown resolve to an "unavailable" outcome with zero data exposed; offered slots respect business hours and existing appointments (reuses the 001 availability engine).
- [x] T021 [P] [US2] Booking action tests `apps/book/src/modules/public-booking/tests/actions.test.ts`: creates an appointment with `origin: 'online'` and initial `pending` status; booking an already-taken slot returns `CONFLICT`.
- [x] T022 [P] [US2] Portal component test `apps/book/src/modules/public-booking/tests/BookingPanel.test.tsx`: slot selection + confirm flow, `vitest-axe` clean.

### Implementation for User Story 2

- [x] T023 [P] [US2] Implement `apps/book/src/modules/public-booking/utils/queries.ts`: `getPublicBusiness(slug)` (only `active`/licensed tenants per `data-model.md` §6–§7) and `getOfferedSlots(tenantId, serviceId, dateRange)` reusing `shared/utils/computeAvailability.ts/computeAvailability.ts`.
- [x] T024 [P] [US2] Implement `apps/book/src/modules/public-booking/utils/actions.ts`: `bookAppointment` using the existing conflict re-check, creating an `Appointment` with `origin: 'online'` (data-model.md §6 of 001) and returning `CONFLICT` on overlap.
- [x] T025 [US2] Build the portal components `TenantPublicHeader`, `ServiceList` and `BookingPanel` in `apps/book/src/modules/public-booking/components/` using `@foundly/ui` primitives (guest booking, no account required).
- [x] T026 [US2] Build `apps/book/src/app/[tenantSlug]/page.tsx` as a Server Component: resolve the tenant, render the portal or the "not available" state for unknown/draft/suspended tenants with no business data exposed.

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Use the private workspace scoped to my business (Priority: P2)

**Goal**: The dashboard at `/admin/*` runs inside the Drawer shell and every screen is scoped to the session's tenant.

**Independent Test**: Sign in as an owner, open `/admin/*` and confirm all screens show the owner's business; direct access without a session redirects; cross-tenant reads are denied.

### Tests for User Story 3 (write FIRST)

- [x] T027 [P] [US3] Isolation tests `apps/book/src/shared/tenancy/queries.test.ts`: a session of tenant A cannot resolve tenant B data and `getCurrentTenant` returns the session's tenant (SC-008).
- [x] T028 [P] [US3] Guard test `apps/book/src/app/admin/layout.test.tsx`: rendering `/admin/*` without a session redirects to `/onboarding` (FR-016).

### Implementation for User Story 3

- [x] T029 [US3] Apply `requireTenant` in `apps/book/src/app/admin/layout.tsx`: unauthenticated requests redirect to `/onboarding`; render `AdminShell` only for a valid session (depends on T007).
- [x] T030 [US3] Scope the existing 001 reads to the session tenant: add tenant filtering to `apps/book/src/modules/agenda/utils/queries.ts` (`listAgenda`, `listAvailabilityRules`, `listTimeBlocks`) and the services page, sourcing `tenantId` from `getCurrentTenant(session)` (C4).
- [x] T031 [US3] Surface the current business in the shell: show `Tenant.name` in the `AdminShell` footer beside the user profile (`apps/book/src/shared/components/AdminShell.tsx`).

**Checkpoint**: User Stories 1–3 all work independently; tenant isolation is enforced.

---

## Phase 6: User Story 4 - Learn about Foundly Book from its product page (Priority: P3)

**Goal**: The root route (`/` → public `/book`) explains the module and drives registration.

**Independent Test**: Open `/`, confirm the module capabilities and the call to action lead to `/onboarding`.

### Tests for User Story 4 (write FIRST)

- [x] T032 [P] [US4] Product page test `apps/book/src/app/page.test.tsx`: renders the module capabilities and a CTA linking to `/onboarding` (FR-002), `vitest-axe` clean.

### Implementation for User Story 4

- [x] T033 [US4] Build the product landing on `apps/book/src/app/page.tsx` (features, CTA to `/onboarding`) composed exclusively from `@foundly/ui` primitives; any pricing/licensing copy must respect `specs/business-model.md` (no unratified prices, FR-019).

**Checkpoint**: All user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T034 [P] Document the module in `apps/book/README.md` (routes, onboarding wizard, public portal, tenant scoping, persistence deferred).
- [x] T035 [P] Add a reserved-slug + routing sanity check to `specs/book/002-onboarding-and-tenant-flow/quickstart.md` validation scenario list.
- [x] T036 Run the `quickstart.md` validation: `npm run test -w @foundly/book`, `npm run lint`, `npm run build -w @foundly/book` all green.
- [x] T037 [P] (Optional) Add agenda-pagination note and reserve a future E2E spec `apps/book/e2e/onboarding.spec.ts`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational completion; then proceed sequentially in priority order (US1 → US2 → US3 → US4) or in parallel if staffed.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories (**MVP**).
- **US2 (P2)**: After Foundational + US1 (needs a tenant + provisioned availability).
- **US3 (P2)**: After Foundational + US1 (needs a tenant + session); independent of US2.
- **US4 (P3)**: After Foundational — independent of US1–US3.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Pure logic (schemas, draft, provision) before actions.
- Actions before UI wiring.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Setup tasks marked [P] (T002, T003) run in parallel after T001.
- Foundational tasks T005–T009 run in parallel after T004.
- Story test tasks (T010–T013, T020–T022, T027–T028) run in parallel within their story.
- `schemas.ts`/`draft.ts`/`provision.ts` (T014–T016) run in parallel before T017.
- US3 (tenant scoping) and US4 (landing) can proceed in parallel once US1 is complete.

---

## Parallel Example: User Story 1

```text
# Launch all fail-first tests together:
Task: "T010 Zod schema tests  - apps/book/src/modules/onboarding/tests/schemas.test.ts"
Task: "T011 Draft tests       - apps/book/src/modules/onboarding/tests/draft.test.ts"
Task: "T012 Action tests      - apps/book/src/modules/onboarding/tests/actions.test.ts"
Task: "T013 Wizard tests      - apps/book/src/modules/onboarding/tests/WizardShell.test.tsx"

# Launch the pure modules together:
Task: "T014 Create schemas.ts (modules/onboarding)"
Task: "T015 Create draft.ts   (modules/onboarding)"
Task: "T016 Create provision.ts (shared)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1 (onboarding wizard).
4. **STOP and VALIDATE**: `npm run test -w @foundly/book` + manual wizard run.
5. Demo the registration flow.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → validate → demo (MVP: register + provision).
3. US3 (tenant-scoped admin) → validate; then US2 (public portal) → validate.
4. US4 (product page) → validate.
5. Polish → `quickstart.md` end-to-end.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done: US1 (wizard) is the critical path; US4 landing is independent.
3. After US1: US2 (portal) and US3 (scoping) can be split across developers.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps each task to its user story for traceability.
- Each user story is independently completable and testable.
- Verify tests fail before implementing.
- Commit after each task or logical group.
- Persistence is NOT defined: everything goes through the store seam; no storage technology may be added.
