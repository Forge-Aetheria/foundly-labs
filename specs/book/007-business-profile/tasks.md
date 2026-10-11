---
description: 'Task list for the Foundly Book business profile feature'
---

# Tasks: Foundly Book — Business Profile (Perfil y Acerca de)

**Input**: Design documents from `/specs/book/007-business-profile/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: INCLUDED — spec requires TDD flow with unit + integrated tests at 100% in `@foundly/book` and `@foundly/ui` (spec §Calidad; quickstart validation matrix).

**Organization**: Tasks are grouped by user story (US1–US3) to enable independent implementation and testing.

**Persistence**: Not defined. Panel uses the in-memory store seam; no storage technology may be introduced until ratified in `specs/architecture.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Include exact file paths in descriptions

## Path Conventions

Single location: `apps/book/` (+ `packages/ui/` suite verification).

---

## Phase 1: Setup

**Purpose**: Confirm the existing workspace/test harness; no new scaffolding is needed (monorepo already wired).

- [x] T001 Verify workspace wiring and test harness for `apps/book` and `packages/ui` (root `npm install`; existing vitest configs, `eslint.config.js`/`.prettierrc` unchanged).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The schema and mutation surface backing all three stories — slug-validated profile + policies action.

- [x] T002 [P] Extend `profileSchema` (add `slug`) and add `policySchema`/`policiesSchema` (title ≤120, body ≤1000) in `apps/book/src/modules/{staff,gallery,profile}/utils/schemas.ts` per `data-model.md`.
- [x] T003 Extend `updateProfile` in `apps/book/src/modules/{staff,gallery,profile}/utils/actions.ts` to validate/normalize the `slug` (`shared/utils/slug.ts`: format + reserved + unique, excluding self) and persist it.
- [x] T004 [P] Add `updatePolicies` in `apps/book/src/modules/{staff,gallery,profile}/utils/actions.ts` (replace the tenant's `portalPolicies`; zero or more entries) and `listPolicies` in `apps/book/src/modules/{staff,gallery,profile}/utils/queries.ts`.

**Checkpoint**: mutation surface ready; no UI yet.

---

## Phase 3: User Story 1 - Configure the business identity (Priority: P1) 🎯 MVP

**Goal**: Name, category, public URL and logo/cover (with preview) editable and reflected in the public header and sticky card.

**Independent Test**: `ProfileEditor.test.tsx` + `actions.test.ts` change identity and logo URL, save, and assert `getPublicBusiness('estudio-ana')` reflects the new name/logo and the slug validation rejects invalid/taken values.

### Tests for User Story 1 (TDD — write FIRST, confirm they fail before implementation) ⚠️

- [x] T005 [P] [US1] Action tests in `apps/book/src/modules/{staff,gallery,profile}/tests/actions.test.ts`: `updateProfile` persists name/category/logo; slug format/taken/reused (same business) behavior; public `getPublicBusiness` reflects identity.
- [x] T006 [P] [US1] Component tests in `apps/book/src/modules/profile/tests/ProfileEditor.test.tsx`: identity fields pre-filled, logo/cover URL preview renders, invalid/taken slug shows inline error and save is blocked, valid save shows "Guardado" badge.

### Implementation for User Story 1

- [x] T007 [US1] Rewrite the identity + logo/cover sections in `apps/book/src/modules/profile/components/ProfileEditor.tsx` (slug field with validation messaging, live `<img>` previews via MUI `Box`).
- [x] T008 [US1] Wire `/admin/profile/page.tsx` to pass `profile` (incl. slug) + `policies` + `businessHours` to the editor.

**Checkpoint**: US1 functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Manage contact, socials and address (Priority: P2)

**Goal**: Phone/WhatsApp, Instagram and address editable and reflected in the public sticky card and "Dirección" section.

**Independent Test**: Update contact fields, save, and assert the public sticky card + `#direccion` data change; malformed URLs show inline errors.

### Tests for User Story 2 (TDD — write FIRST) ⚠️

- [x] T009 [P] [US2] Action tests in `apps/book/src/modules/{staff,gallery,profile}/tests/actions.test.ts`: contact/socials persist and empty optional fields normalize to `null`; public `getPublicBusiness` reflects phone/instagram/address.
- [x] T010 [P] [US2] Component tests in `apps/book/src/modules/profile/tests/ProfileEditor.test.tsx`: contact fields pre-filled, empty values render placeholders and save, malformed URL error behavior.

### Implementation for User Story 2

- [x] T011 [US2] Complete the contact and socials section in `apps/book/src/modules/profile/components/ProfileEditor.tsx` (phone, Instagram, WhatsApp, address).

**Checkpoint**: US1 AND US2 independently testable.

---

## Phase 5: User Story 3 - Describe the business and its policies (Priority: P3)

**Goal**: About text, reservation/cancellation policies and a visual hours summary sourced from availability.

**Independent Test**: Save About + a policy, and assert the public "Acerca de" section and policies card update; the hours summary renders the seeded week (Mon–Sat open, Sunday closed).

### Tests for User Story 3 (TDD — write FIRST) ⚠️

- [x] T012 [P] [US3] Action tests in `apps/book/src/modules/{staff,gallery,profile}/tests/actions.test.ts`: `updatePolicies` replaces the tenant policies and `getPublicBusiness(...).policies` reflects them.
- [x] T013 [P] [US3] Component tests in `apps/book/src/modules/profile/tests/ProfileEditor.test.tsx`: About textarea, policy add/remove rows and the read-only weekly hours summary render correctly.

### Implementation for User Story 3

- [x] T014 [US3] Add the About textarea (multiline, ≤1000 with counter), the policies editor (add/remove rows) and the weekly hours summary (from `businessHours` + `WEEKDAY_LABELS`) in `apps/book/src/modules/profile/components/ProfileEditor.tsx`.

**Checkpoint**: all user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, docs and repo-wide gates on top of the feature.

- [x] T015 [US3] Confirm the profile editor composes `@foundly/ui` only and passes `vitest-axe` (SC-004) in `ProfileEditor.test.tsx`.
- [x] T016 Document the surface in `contracts/admin-profile.contract.md`, this `tasks.md`, and cross-reference from `apps/book/README.md`.
- [x] T017 Run the `quickstart.md` validation matrix: `npm run test -w @foundly/book`, `npm run test -w @foundly/ui`, `npm run build -w @foundly/book`.
- [x] T018 [P] Lint the change set (`npm run lint`) and run `npm run typecheck -w @foundly/book`; fix any report before commit.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories.
- **US1 (P1)**: after Foundational — MVP.
- **US2 (P2)**: after Foundational — may extend US1's form but independently testable.
- **US3 (P3)**: after Foundational — adds About/policies/hours.
- **Polish (Phase 6)**: after all desired user stories.

### Within Each User Story

- Tests are written FIRST and must FAIL before the implementation task lands (TDD per spec §Calidad).
- Models/schemas → actions → component → page wiring.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Foundational T002/T004 (different files/modules) run in parallel; T003 depends on T002.
- Test tasks marked [P] (T005/T006, T009/T010, T012/T013) are independent within their story.
- Component work (T007/T011/T014) touches the same `ProfileEditor.tsx` file → MUST run sequentially.

---

## Parallel Example: User Story 1

```text
# Write the failing tests first (TDD):
Task: "Action tests updateProfile slug in actions.test.ts"          (T005)
Task: "Component tests ProfileEditor identity/preview"               (T006)

# Then implement (after tests fail):
Task: "ProfileEditor identity + logo/cover previews"                 (T007)
Task: "Admin profile page passes profile/policies/hours"             (T008)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2 (foundation).
2. Write T005/T006 tests (fail), implement T007/T008.
3. **STOP and VALIDATE**: `npm run test -w @foundly/book` green → demo identity sync.

### Incremental Delivery

1. Foundation → US1 (identity) → validate → demo (MVP).
2. US2 (contact/socials) → validate → demo.
3. US3 (about/policies/hours) → validate → demo.

---

## Notes

- [P] tasks = different files, no incomplete dependencies.
- `ProfileEditor.tsx` edits across user stories run sequentially (same-file coordination).
- Domain logic (`apps/book/src/shared`) stays free of React/Next/MUI/storage imports (C2).
- All views use `@foundly/ui` exclusively (C1); raw `<img>` previews use the MUI `Box` primitive.
- Persistence not defined (C3): only the store seam may be swapped.
- Commit after each task or logical group.
