# Tasks: Book Support and About Pages

**Input**: `specs/book/023-support-about-pages/`

## Phase 1: Setup

- [X] T001 Confirm `/admin/soporte` and `/admin/acerca` render placeholders in `apps/book/src/app/admin/soporte/page.tsx` and `apps/book/src/app/admin/acerca/page.tsx`.
- [X] T002 Confirm public URLs for site/privacy/terms and the support email strategy.
- [X] T003 Confirm no API/codegen work is required.

## Phase 2: Foundational

- [X] T004 [P] Create Support content (intro, FAQ, contact) in `apps/book/src/modules/support/support-content.ts`.
- [X] T005 [P] Create About content (product, version, legal links) in `apps/book/src/modules/about/about-content.ts`.
- [X] T006 [P] Add content validation tests in `apps/book/src/modules/support/tests/content.test.ts` and `apps/book/src/modules/about/tests/content.test.ts`.

## Phase 3: User Story 1 — Ayuda y Soporte (P1, MVP)

- [X] T007 [P] [US1] Create `apps/book/src/modules/support/SupportView.tsx` with intro, FAQ accordion and contact channels.
- [X] T008 [US1] Replace the placeholder in `apps/book/src/app/admin/soporte/page.tsx` with `SupportView`.
- [X] T009 [US1] Verify external links use safe `mailto:`/`https:` targets.

## Phase 4: User Story 2 — Acerca de Foundly (P2)

- [X] T010 [P] [US2] Create `apps/book/src/modules/about/AboutView.tsx` with branding, version, description and links.
- [X] T011 [US2] Replace the placeholder in `apps/book/src/app/admin/acerca/page.tsx` with `AboutView`.
- [X] T012 [US2] Verify version fallback and external links.

## Phase 5: Polish

- [X] T013 Run `pnpm --filter @foundly/book typecheck` for `apps/book`.
- [X] T014 Run `pnpm --filter @foundly/book lint` for `apps/book`.
- [X] T015 Run `pnpm --filter @foundly/book test` for `apps/book`.
- [X] T016 Run `pnpm --filter @foundly/book build` for `apps/book`.
- [X] T017 Execute the manual scenarios in `specs/book/023-support-about-pages/quickstart.md`.
- [X] T018 Remove `PlaceholderPanel` usage from the two routes and confirm no dead imports.

## Dependencies

- Setup → Foundational → US1/US2 (parallel) → Polish.
- US1 and US2 are independent after content foundations.

## Notes

- Static content only; no data layer.
- Reuse `@foundly/ui` and existing theme.
- [P] tasks touch different files.


## Completion Notes

- Automated gates passed: typecheck, lint, 328 tests and `next build`.
- Device/browser-level quickstart (T017) remains recommended.
