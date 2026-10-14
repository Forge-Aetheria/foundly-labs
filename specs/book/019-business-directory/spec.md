# Feature Specification: Foundly Book — Public Business Directory & Discovery

**Feature Branch**: `019-business-directory`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "@apps/book @apps/api — Fase 2: Directorio / Buscador de Negocios & Perfiles Públicos. Ruta de descubrimiento (`/directorio` o `/explorar`): vista pública que lista fichas (cards) de los negocios activos, buscador de texto (nombre, categoría o ciudad) y tarjeta de negocio (avatar/logo, portada, nombre, descripción corta, dirección/ubicación, horario general, botón 'Ver perfil'/'Reservar'). Integración con la vista pública del negocio (`/[tenantSlug]`) y el flujo de agendamiento existente (calendario, horarios, adelanto)."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `book` domain because the affected application is `apps/book`; it extends `specs/book/003-public-portal-minisite`, `specs/book/008-api-integration-catalog-sync` and `specs/book/017-advance-payments-booking`. The public listing query it depends on is the backend counterpart specified under `specs/api/018-business-directory`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse the public directory (Priority: P1)

As an anonymous visitor, I want a public page that lists the registered businesses as cards, so I can discover services I might book.

**Why this priority**: The directory is the entry point of discovery and the reason for this phase.

**Independent Test**: Open the directory route and confirm it lists cards for active businesses; with no eligible businesses, confirm a clean empty state (not an error).

**Acceptance Scenarios**:

1. **Given** the directory route, **When** it loads, **Then** it shows a responsive grid of business cards for the eligible active businesses.
2. **Given** there are no eligible businesses, **When** it loads, **Then** a clean empty state is shown inviting the visitor to return later.
3. **Given** the API is slow, **When** the page loads, **Then** loading placeholders are shown in place of the cards.
4. **Given** the API is unavailable, **When** the page loads, **Then** a friendly error state with a retry is shown and the page does not crash.

---

### User Story 2 - Search and filter businesses (Priority: P1)

As an anonymous visitor, I want to search the directory by name, category or city, so I can narrow the list to what I need.

**Why this priority**: Search is the core discovery interaction requested.

**Independent Test**: Type a term matching one business and confirm the list narrows to it; clear the term and confirm the full list returns; type a nonsense term and confirm a no-results state.

**Acceptance Scenarios**:

1. **Given** the directory, **When** the visitor types a term, **Then** the list narrows to businesses matching by name, category or city (case-insensitive).
2. **Given** a term with results, **When** the visitor clears it, **Then** the full list is restored.
3. **Given** a term with no results, **When** it is applied, **Then** a clear "no results" state is shown with guidance to try another term.
4. **Given** the visitor types quickly, **When** the term changes, **Then** the list updates without requiring a full page reload or losing focus.

---

### User Story 3 - Understand a business at a glance from its card (Priority: P1)

As an anonymous visitor, I want each business card to show its identity, location and general opening hours with a clear action, so I can decide whether to open it.

**Why this priority**: The card is the visible deliverable and the decision surface.

**Independent Test**: Inspect a card and confirm it shows the logo/avatar, cover, name, short description, location and general opening hours, plus a prominent "Ver perfil"/"Reservar" action.

**Acceptance Scenarios**:

1. **Given** an eligible business, **When** its card renders, **Then** it shows the logo/avatar, cover, name, short description, location and general weekly opening hours.
2. **Given** a business missing an optional field (e.g. cover or description), **When** its card renders, **Then** a sensible placeholder is shown and the card still renders cleanly.
3. **Given** a business with no configured hours, **When** its card renders, **Then** the hours area shows a neutral placeholder instead of an empty/broken block.
4. **Given** the card, **When** the visitor looks at it, **Then** a prominent "Ver perfil" (or "Reservar") action is visible.

---

### User Story 4 - Open a business and start booking (Priority: P1)

As an anonymous visitor, I want "Ver perfil" to take me to the business's public page where I can start booking, so discovery leads to an appointment.

**Why this priority**: It connects discovery to the existing booking flow — the point of the directory.

**Independent Test**: Click "Ver perfil" on a card and confirm navigation to the business's public page (`/[tenantSlug]`), where the existing service catalog and booking flow (calendar, slots, advance if required) are available.

**Acceptance Scenarios**:

1. **Given** a business card, **When** the visitor activates "Ver perfil", **Then** they navigate to that business's public page by slug.
2. **Given** the business's public page, **When** it loads, **Then** the existing service catalog and booking flow (calendar, time slots, and the advance/payment step when the service requires it) are available.
3. **Given** a business that becomes unavailable, **When** its public page is opened, **Then** the existing unavailable-state handling is shown.
4. **Given** a shared/back navigation into the directory, **When** the visitor returns, **Then** the directory (including the current search term) is usable again.

---

### Edge Cases

- Empty directory: a clean empty state, never an error or a broken grid.
- Search term with only whitespace: treated as empty (full list).
- Search with accented/special characters: does not crash; best-effort matching.
- A very large number of results: the list is bounded/paged and remains responsive.
- A business with no cover/description/hours: the card renders with placeholders.
- A business removed or suspended between listing and click: the public page shows its unavailable state cleanly.
- Rapid typing: search does not lose focus or submit the page on every keystroke.
- Slow network: skeletons appear and resolve into cards without layout jumps.
- Direct visit to the directory route with no query: behaves like an empty search.
- The directory is reachable without authentication; no admin UI is exposed.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The application MUST expose a **public** directory route (default `/directorio`) reachable without authentication.
- **FR-002**: The route MUST render a responsive list of **business cards** for the eligible active businesses returned by the public listing.
- **FR-003**: The page MUST provide a **text search** input that filters businesses by **name, category or city**, case-insensitively, without a full page reload.
- **FR-004**: An empty or whitespace-only search term MUST show the full eligible list; a term with no matches MUST show a clear "no results" state.
- **FR-005**: Each **business card** MUST show the business logo/avatar, cover, name, short description, location/address and general weekly opening hours.
- **FR-006**: Each card MUST present a prominent action ("Ver perfil" / "Reservar") that navigates to the business's public page at `/[tenantSlug]`.
- **FR-007**: The directory MUST connect to the existing public business page so the visitor can start the existing booking flow (service catalog, calendar, time-slot selection, and the advance/payment step when the selected service requires it).
- **FR-008**: The page MUST define **loading** (skeletons/placeholders), **empty** (no businesses and no results), and **error** (retry) states.
- **FR-009**: Missing optional business fields MUST degrade gracefully (placeholders) without breaking the card layout.
- **FR-010**: The directory data access MUST follow the module data-layer convention (`actions.ts` / `hooks.ts` / `<module>.graphql` with codegen-only types); the UI MUST NOT call the API or data hooks directly.
- **FR-011**: The page MUST be responsive and accessible (keyboard-operable search and card actions, meaningful link semantics, adequate color contrast using existing design tokens).
- **FR-012**: Automated tests MUST cover: rendering the directory grid from the listing; search filtering (match, clear, no results); card content and graceful placeholders; navigation from a card to the public page; and the empty/error/loading states.
- **FR-013**: All book gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities _(include if feature involves data)_

- **Directory listing entry**: the public business summary rendered on a card (slug, name, category, short description, location, logo/avatar, cover, general weekly hours).
- **Business card**: the visual unit of the directory presenting one listing entry with a "Ver perfil"/"Reservar" action.
- **Search term**: the free-text input that filters the listing by name, category or location.
- **General weekly schedule**: the aggregate opening hours shown on the card.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A visitor can go from opening the directory to opening a specific business's public page in at most two interactions (enter a term, activate a card).
- **SC-002**: 100% of listed cards show the logo/avatar, name, short description, location and general hours (with graceful placeholders when a field is empty).
- **SC-003**: 100% of search terms filter by name, category or city case-insensitively; a non-matching term shows a clear no-results state and never an error.
- **SC-004**: The directory loads its cards within the standard web interaction budget on a typical connection, using skeletons while data arrives.
- **SC-005**: 0 broken states: empty, loading, error and no-results are all handled with clear UI.
- **SC-006**: 100% of "Ver perfil" activations land on the correct business public page, from which the booking flow can be started.
- **SC-007**: All book gates pass with zero regressions.

## Assumptions

- **Route name**: the directory lives at `/directorio` (the request offered `/directorio` or `/explorar`); the public business page stays at `/[tenantSlug]`.
- **Companion backend feature**: the public listing/search query and eligibility rules are the `api` counterpart `specs/api/018-business-directory`; this spec defines the user-facing behavior only.
- **No authentication**: the directory and the public business page remain guest-accessible; no admin functionality is exposed.
- **Presentation reuses the existing design system**: the cards, badges, skeletons and states use the existing Clean Light UI tokens and primitives rather than new visual language.
- **Opening hours are informational**: the card shows the general weekly schedule from the listing (aggregate); live availability remains computed in the existing booking flow.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (module discovery and the Foundly Book value proposition) and the authority order of `constitution.md`.
