# Feature Specification: Foundly API — Public Business Directory Query

**Feature Branch**: `018-business-directory`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "@apps/book @apps/api — Fase 2: Directorio / Buscador de Negocios & Perfiles Públicos. Directorio público de descubrimiento en apps/book para explorar, buscar y filtrar negocios registrados y acceder a sus perfiles públicos para agendar. Backend: garantizar una query pública (`publicBusinesses` o `searchBusinesses`) en la API que retorne los negocios activos habilitados para figurar en el directorio público."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the affected application is `apps/api`; it extends the public tenant/business surface of `specs/api/003-db-first-graphql-core` and `specs/api/014-availability-time-blocks`, and is the backend counterpart of `specs/book/019-business-directory`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - List businesses eligible for the public directory (Priority: P1)

As an anonymous visitor through the discovery directory, I want the API to return the active businesses that are eligible to be listed publicly, so the directory can show real, bookable businesses.

**Why this priority**: Without the listing there is no directory; it is the foundation of discovery.

**Independent Test**: Request the directory listing with no search term and confirm it returns only active, eligible businesses (public profile present, at least one active service) and never draft/suspended/incomplete ones.

**Acceptance Scenarios**:

1. **Given** several registered businesses, **When** the directory listing is requested, **Then** only those that are active, have a public profile and at least one active service are returned.
2. **Given** a business with no public profile (no slug) or with no active service, **When** the directory listing is requested, **Then** it is excluded.
3. **Given** a drafted or suspended business, **When** the directory listing is requested, **Then** it is excluded.
4. **Given** an anonymous request, **When** the directory listing is requested, **Then** it succeeds without authentication.

---

### User Story 2 - Search businesses by text (Priority: P1)

As an anonymous visitor, I want to filter the directory by a text term matched against the business name, category or location, so I can find the business I am looking for.

**Why this priority**: Search is the primary discovery interaction requested for the directory.

**Independent Test**: Search for a term present in one business's name/category/address and confirm only matching eligible businesses are returned; search a nonsense term and confirm an empty list (never an error).

**Acceptance Scenarios**:

1. **Given** eligible businesses, **When** the search term matches a business's name, **Then** that business is returned.
2. **Given** a search term matching a category or the address/city, **When** it is applied, **Then** matching businesses are returned.
3. **Given** an empty or whitespace-only term, **When** the listing is requested, **Then** all eligible businesses are returned (no filtering).
4. **Given** a term with no matches, **When** it is applied, **Then** an empty list is returned (not an error).
5. **Given** the search term casing differs from the stored value, **When** it is applied, **Then** matching remains case-insensitive.

---

### User Story 3 - Provide the fields a directory card needs (Priority: P1)

As the directory front-end, I need each listed business to carry the identity, location and general opening hours needed to render a card, so the card is complete without extra per-business requests.

**Why this priority**: The card content is the visible deliverable of the directory.

**Independent Test**: Read a listing entry and confirm it exposes slug, name, category, a short description, address/location, avatar/logo, cover and a general weekly opening schedule; a business with no availability returns an empty schedule without error.

**Acceptance Scenarios**:

1. **Given** an eligible business, **When** it is listed, **Then** its entry includes slug, name, category, short description, address, logo/avatar, cover and its general weekly schedule.
2. **Given** an eligible business with configured availability, **When** it is listed, **Then** the schedule reflects its opening days/ranges.
3. **Given** an eligible business with no availability configured, **When** it is listed, **Then** the schedule is empty and no error occurs.
4. **Given** businesses with missing optional profile fields, **When** they are listed, **Then** those fields are returned as empty and the entry is still returned.

---

### User Story 4 - Bounded, stable listing (Priority: P2)

As the directory front-end, I want the listing to be ordered and bounded, so large directories stay fast and predictable.

**Why this priority**: It protects the endpoint from unbounded responses and keeps paging predictable.

**Independent Test**: Request the listing with an oversized `limit` and confirm the result is capped; confirm entries are returned in a stable order; a negative offset is rejected.

**Acceptance Scenarios**:

1. **Given** many eligible businesses, **When** the listing is requested without paging, **Then** a sensible default limit is applied.
2. **Given** a requested `limit` above the maximum, **When** it is applied, **Then** the result is capped at the maximum.
3. **Given** a `limit`/`offset` and a stable order, **When** paging is applied, **Then** consecutive pages do not repeat or skip entries.
4. **Given** a negative `offset` or a non-positive `limit`, **When** it is provided, **Then** it is rejected with a validation error.

---

### Edge Cases

- Empty directory (no eligible businesses): the listing returns an empty list, never an error.
- A business that becomes suspended after being listed: it disappears from the next read.
- Case/whitespace in the search term: trimmed and case-insensitive; whitespace-only behaves like empty.
- A business with a profile but no active services is excluded (nothing bookable).
- A business with availability only for some weekdays: the schedule includes only the configured days.
- A business whose availability differs per specialist: the general schedule is a coherent aggregate (union per weekday), not an error.
- Special characters or accented characters in the search term do not crash the query; matching remains best-effort.
- Very long search terms are handled without error (bounded or ignored beyond a length).
- Field values containing only whitespace are treated as empty in the listing.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The API MUST expose a **public** (no authentication) directory query that returns the businesses eligible to appear in the directory, with an optional free-text search term.
- **FR-002**: A business is eligible for the directory only when it is **active**, has a **public profile** (a public slug), and has at least one **active service**.
- **FR-003**: The query MUST exclude non-eligible businesses (draft/suspended, without a public profile, or without an active service) from every result, including search results.
- **FR-004**: The search term MUST filter case-insensitively across the business **name**, **category** and **location/address**; an empty or whitespace-only term MUST return all eligible businesses.
- **FR-005**: Each returned entry MUST expose, at minimum: tenant id, public **slug**, **name**, **category**, a **short description**, **address/location**, **logo/avatar**, **cover**, and a **general weekly schedule**.
- **FR-006**: The general weekly schedule MUST aggregate the business's configured availability into weekday opening ranges; when no availability is configured it MUST be empty (never an error).
- **FR-007**: The results MUST be returned in a stable order and MUST be bounded by a default limit, a maximum limit, and an offset for paging.
- **FR-008**: Invalid paging input (non-positive limit, negative offset) MUST be rejected with a stable validation error; a limit above the maximum MUST be capped.
- **FR-009**: A search or listing with no matches MUST return an empty list, never an error.
- **FR-010**: Automated tests MUST cover: eligibility filtering (active + profile + active service); search by name/category/address (case-insensitive, empty term, no match); schedule aggregation (with and without availability); default/max limit and offset paging; and error responses for invalid paging.
- **FR-011**: All API gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Directory listing entry**: a publicly discoverable business summary — identity (slug, name, category, short description), presentation (logo/avatar, cover), location (address), and a general weekly schedule.
- **General weekly schedule**: the aggregate of a business's configured availability expressed as weekday opening ranges.
- **Eligibility rules**: the conditions (active, public profile, at least one active service) that make a business discoverable.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of returned directory entries correspond to active businesses with a public profile and at least one active service.
- **SC-002**: 0 non-eligible businesses (draft, suspended, no profile, no active service) appear in any listing or search result.
- **SC-003**: 100% of search terms match case-insensitively across name, category and address; a term with no matches returns an empty list.
- **SC-004**: Every listed entry carries the fields required to render a card, including a weekly schedule (empty when no availability exists) — 100% of the time.
- **SC-005**: The listing is always bounded by the configured default/maximum limits and remains stable across pages.
- **SC-006**: All API gates pass with zero regressions.

## Assumptions

- **Eligibility by rules, not a new flag**: discoverability is derived from existing state (active + public profile + at least one active service); an explicit business opt-out/"listed" flag is out of scope for this phase and would be a separate feature.
- **General schedule is an aggregate**: the weekly schedule is a best-effort aggregate of the business's availability (business-level rules when present, otherwise the union of active specialists' rules per weekday); precise per-specialist schedules remain in the existing availability reads.
- **Text search is a simple case-insensitive containment match**: no fuzzy/ranking engine in this phase.
- **Paging is limit/offset with a documented default and maximum**: no cursor pagination in this phase.
- **Public and credential-free**: consistent with the existing public booking/availability reads; no tenant-scoping argument is trusted for moderation data.
- **Companion front-end spec**: the directory route, search UI and business cards are the `book` counterpart `specs/book/019-business-directory`; this spec defines the API contract only.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (module discovery and the Foundly Book value proposition) and the authority order of `constitution.md`.
