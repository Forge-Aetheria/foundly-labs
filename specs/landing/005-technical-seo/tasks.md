---
description: 'Task list for Technical SEO & Metadata'
---

# Tasks: Technical SEO & Metadata

**Input**: Design documents from `/specs/landing/005-technical-seo/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Not requested in the feature specification. No test tasks are generated; validation is
build-, type-, lint-, and manual/validator based per [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing
of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single static Astro project at the repository root: `src/`, `public/`, root config files.
- Paths below follow [plan.md](./plan.md#source-code-repository-root).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the build-time dependency used by the crawl story

- [x] T001 Add `@astrojs/sitemap@^3` to `package.json` and install it

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared SEO data and component that every story builds on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Extend `SiteConfig` with the official `defaultTitle`, official `description`, `defaultImage`, and `parentOrganization` (FORGE Labs) in `src/shared/types/index.ts` and `src/shared/data/siteConfig.ts`; add an `SEOProps` type
- [x] T003 Create `src/shared/components/SEO.astro` with typed props (`title`, `description`, `image`, `canonicalURL`), default resolution, `<title>`, `<meta name="description">`, and an absolute self-referencing `<link rel="canonical">`
- [x] T004 Inject `<SEO />` into `src/shared/components/BaseLayout.astro` (passing the page props through) and remove the inline title/description/canonical/OG/Twitter tags

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Discoverable and indexable (Priority: P1) 🎯 MVP

**Goal**: Crawlers can discover every page, each page declares a canonical URL, and a sitemap/robots
policy exposes the site.

**Independent Test**: Build and confirm `dist/sitemap-index.xml` and `dist/robots.txt` exist, and
that every page has an absolute canonical URL and defaults when inputs are omitted.

### Implementation for User Story 1

- [x] T005 [US1] Register the `@astrojs/sitemap` integration in `astro.config.mjs` (the `site` origin is already set)
- [x] T006 [P] [US1] Create `public/robots.txt` allowing all agents and advertising `https://foundlylabs.com/sitemap-index.xml`
- [x] T007 [US1] Verify `dist/sitemap-index.xml` lists `/`, `/privacy/`, `/terms/`, that `dist/robots.txt` allows crawling, and that every built page has one absolute canonical URL and applied defaults

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Rich link previews (Priority: P2)

**Goal**: Shared links show the correct brand title, description, and image on social platforms.

**Independent Test**: Inspect a built page's head for the Open Graph and Twitter Card tags and
confirm per-page overrides work.

### Implementation for User Story 2

- [x] T008 [US2] Add Open Graph tags (`og:type=website`, `og:site_name=Foundly Labs`, `og:title`, `og:description`, `og:url`, `og:image`) to `src/shared/components/SEO.astro`
- [x] T009 [US2] Add Twitter Card tags (`twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`) and resolve the default image to an absolute URL in `src/shared/components/SEO.astro`
- [x] T010 [US2] Verify the OG/Twitter tags use the official defaults and that a page-level `title`/`description`/`image` overrides them

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Machine-readable brand data (Priority: P3)

**Goal**: Structured data describes the organization (with FORGE Labs as parent) and the ecosystem
applications.

**Independent Test**: Parse the built page's JSON-LD, confirm the Organization references FORGE
Labs and the SoftwareApplication list matches `src/shared/data/apps.ts`, and validate with zero errors.

### Implementation for User Story 3

- [x] T011 [US3] Add the `Organization` JSON-LD block (name, url, logo, `parentOrganization` = FORGE Labs) via `<script type="application/ld+json" is:inline set:html={JSON.stringify(...)} />` in `src/shared/components/SEO.astro`
- [x] T012 [US3] Add the `SoftwareApplication` `ItemList` JSON-LD derived from `src/shared/data/apps.ts` in `src/shared/components/SEO.astro`
- [x] T013 [US3] Verify both JSON-LD blocks parse/validate with zero errors and that no executable client JavaScript was added

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and governance alignment

- [x] T014 Run `npm run check`, `npm run lint`, and `npm run build` and confirm 0 errors/problems and the new build artifacts
- [x] T015 [P] Validate the structured data with a Schema.org/Rich Results validator and confirm preview tags render
- [x] T016 [P] Add `src/shared/components/` to the component locations in `code-rules.md` to resolve the structural deviation recorded in the plan

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - US1 → US2 → US3 in priority order (US2 and US3 both extend the shared `SEO.astro`)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — adds the sitemap integration and robots file; canonical/defaults come from Foundational
- **User Story 2 (P2)**: After Foundational — adds OG/Twitter tags to `SEO.astro`
- **User Story 3 (P3)**: After Foundational — adds JSON-LD to `SEO.astro`

### Within Each User Story

- Data/types/config before components
- Implementation before verification

### Parallel Opportunities

- Setup: T001 alone
- Foundational: T002 in parallel with starting T003
- US1: T006 in parallel with T005
- Polish: T015 and T016 in parallel

---

## Parallel Example: Foundational / US1

```bash
Task: "Extend SiteConfig and add SEOProps in src/shared/types/index.ts and src/shared/data/siteConfig.ts"
Task: "Create public/robots.txt"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: sitemap + robots + canonical/defaults
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → shared SEO component wired into the layout
2. US1 → crawlable and indexable (MVP)
3. US2 → rich link previews
4. US3 → structured data
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps a task to a specific user story for traceability
- Tests are not requested; validation is via `npm run check`, `npm run lint`, `npm run build`, and a schema validator
- Commit after each task or logical group (use `feat(scope)` per the constitution)
- JSON-LD must stay `is:inline` (data, not executable JS)
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
