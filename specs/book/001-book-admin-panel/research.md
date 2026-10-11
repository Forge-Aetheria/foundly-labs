# Phase 0 — Research: Foundly Book Admin Panel

**Feature**: `specs/book/001-book-admin-panel/` | **Date**: 2026-10-08

Resolves the technical unknowns from the plan's Technical Context. Each item records the decision, rationale and alternatives considered.

## R1. Application framework and rendering model

- **Decision**: Next.js with the **App Router**, server-first: Server Components for reads, Server Actions for mutations, and small isolated client components only for the interactive views (agenda/services/availability).
- **Rationale**: Book is an interactive SaaS module; the App Router gives server-side data loading (fast first paint) and a clean mutation path without a separate API layer. It matches the constitution's Server-First / Zero-JS-by-default stance.
- **Alternatives considered**: Pages Router; a separate REST/GraphQL API + SPA (extra surface for no v1 benefit).

## R2. Persistence strategy — deferred (not defined)

- **Decision**: Do **not** introduce any persistence technology or shared data package in this feature. The panel uses an **in-memory store (mock)** exposed only through a single seam (`apps/book/src/shared/infra/store.ts`) and typed exclusively with TypeScript interfaces. The ecosystem's persistence strategy is **not yet defined** and must be decided and documented in `specs/architecture.md` before any storage is adopted.
- **Rationale**: The ecosystem's storage strategy was never ratified. Introducing a database package now would be an unauthorized architectural decision and would leak storage concerns into domain and UI code. A decoupled seam keeps the feature testable and reversible.
- **Alternatives considered**: introducing a shared data package (rejected — unauthorized); coupling domain/UI directly to a storage client (rejected — violates decoupling and C3).
- **Consequence**: When persistence is ratified, only the store seam is replaced; the domain engine, actions and views stay unchanged.

## R3. Availability computation (the core domain engine)

- **Decision**: Implement availability as a **pure TypeScript module** in `apps/book/src/shared/utils` with no framework imports. It takes a resource, a service (duration + buffer), the applicable rules and blocks, and the existing appointments, and returns the ordered set of bookable slots for a date range.
- **Rationale**: Availability is the highest-risk logic (overlaps, buffers, blocks, lead time, horizon). Isolating it makes it exhaustively unit-testable, satisfies constraint C2, and keeps the UI dumb.
- **Algorithm sketch**: per day → resolve working intervals from weekly rules → subtract breaks and time blocks → expand into slots by granularity → drop slots that violate minimum lead time / booking horizon → drop slots that overlap existing appointments (including their buffers) → drop slots whose service duration + buffer does not fit inside a working interval.
- **Alternatives considered**: computing availability in the components (rejected by C2); delegating slot generation to the storage layer (rejected — storage is undefined and would make the logic untestable).

## R4. Time and timezone handling

- **Decision**: Represent instants as UTC ISO strings in the domain model and keep an explicit `timezone` on the business/resource. Wall-clock arithmetic for slot generation is done with the native `Intl` API (no external date library required). A single timezone per business is assumed in v1.
- **Rationale**: Correct handling of DST and "crossing midnight" requires separating the instant from the local wall-clock. The native `Intl` API is sufficient and dependency-free.
- **Alternatives considered**: a date library (adds a dependency with no v1 benefit); raw `Date` math without timezone awareness (DST-buggy); storing local strings only (ambiguous across DST).

## R5. Preventing double-bookings

- **Decision**: Enforce at two layers: (a) the pure engine excludes unavailable slots before an action runs; (b) each mutation re-checks for overlapping appointments for the resource inside the store and rejects the change with `CONFLICT` if a clash is found.
- **Rationale**: UI-level checks alone are insufficient; a server-side re-check makes the guarantee real. For this version the store is a single in-process mock, so the re-check is effectively atomic; when a real storage layer is ratified it must provide the same guarantee (e.g., a transactional re-check).
- **Alternatives considered**: trusting the UI (rejected by SC-003); building storage-level constraints now (rejected — storage is undefined).

## R6. Validation and typing strategy

- **Decision**: Define **Zod schemas** in the feature for every server-action input and derive TypeScript types from them. Strict TS, no `any`, no unsafe casts.
- **Rationale**: Satisfies Principle IV and gives one source of truth for input validation. Domain entities are plain TypeScript interfaces.

## R7. Roles and identity

- **Decision**: Treat **Foundly Pass SSO** as an external dependency that supplies an authenticated session with a role. The panel enforces two roles in v1: **administrator** (full access to catalog, availability and all appointments) and **professional** (sees and manages their own agenda). Implement a thin `requireRole` guard; do not build authentication.
- **Rationale**: Business model §3 establishes centralized identity; building auth in the module would violate the SSO principle.
- **Alternatives considered**: building local auth (rejected by Foundly Pass SSO); role-less panel (rejected by FR-015).

## R8. UI composition with @foundly/ui

- **Decision**: Compose the agenda, services and availability views **exclusively** from `@foundly/ui` primitives (`Card`, `DataTable`, `Badge`, `Chip`, `Button`, `Modal`, `TextField`, `Typography`, `Stack`, `Container`) and the `FoundlyThemeProvider`; no ad-hoc brand styling. The admin navigation shell is an app-level composition documented in R10.
- **Rationale**: Guarantees SC-006/SC-007 and the design-system principle.
- **Alternatives considered**: styling MUI directly in the app (rejected by Principle VI).

## R9. Testing strategy

- **Decision**: **Vitest** for the availability engine and panel logic; **Vitest + React Testing Library + vitest-axe** for the views.
- **Rationale**: The risky logic is pure and cheap to unit-test. Component tests cover accessibility.
- **Alternatives considered**: only E2E (slow, poor signal for edge cases); no tests (rejected by the workflow gates).

## R10. Admin navigation shell, branding and iconography

- **Decision**: Render the admin shell as a persistent left **navigation drawer** (a temporary/collapsible drawer on small viewports) built from MUI structural components (`Drawer`, `List`, `ListItemButton`, `Avatar`, `IconButton`) styled **only with theme tokens**, combined with the `@foundly/ui` `Typography`/`Stack`/`Container` primitives. The drawer header shows the Foundly Book **branding logo** via `next/image`; the footer shows the active **user profile** (avatar with initials, display name and role). Primary navigation is Agenda, Servicios and Disponibilidad; secondary placeholder navigation is Configuración, Ayuda/Soporte and Acerca de Foundly. Navigation icons come from `@mui/icons-material` (already a `@foundly/ui` peer dependency) imported per-symbol.
- **Rationale**: The design system exposes no navigation-shell primitive, and the constitution favours a single shared visual identity. Composing the shell from theme-token-styled MUI structure (rather than adding brand styling) keeps it on-system; per-symbol icon imports keep the bundle tree-shaken; `next/image` with the packaged branding assets keeps the header crisp and optimised. This supersedes the generic top `AppHeader` baseline of `specs/system-design.md` §5.1 **for the Book module only** (see Open items).
- **Alternatives considered**: adding a `Sidebar`/`AppShell` primitive to `@foundly/ui` (deferred — the shell is app-specific and belongs to `apps/book`); keeping the flat top AppBar (rejected — the module navigation has grown beyond a single row); whole-icon-library imports (rejected by the icon/bundle policy).

## Open items

None. All Technical Context unknowns are resolved; no `NEEDS CLARIFICATION` remains. The persistence strategy is explicitly deferred to `specs/architecture.md`, and Foundly Pass SSO is captured as an external dependency.

**Doc alignment note**: the Book admin panel adopts a left sidebar shell (R10) instead of the global top `AppHeader` described in `specs/system-design.md` §5.1. The divergence is intentional for the SaaS workspace and should be reflected in the next amendment of `specs/system-design.md`.
