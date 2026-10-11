# Phase 0 — Research: Foundly Book — Business Onboarding & Tenant Flow

**Feature**: `specs/book/002-onboarding-and-tenant-flow/` | **Date**: 2026-10-08

Resolves the technical unknowns from the plan's Technical Context. Each item records the decision, rationale and alternatives considered.

## R1. Routing model and the `/book` public prefix

- **Decision**: Serve four surfaces from `apps/book` using the Next.js **App Router**: a static product page at `/`, the wizard at `/onboarding`, the authenticated dashboard under a real `/admin` segment, and a public dynamic segment `/[tenantSlug]`. The **public** URLs the user sees are `/book`, `/book/onboarding`, `/book/admin/*` and `/book/<slug>`; the `/book` prefix is stripped by the multi-zone gateway defined in `specs/architecture.md` §2, so the app only knows the internal paths.
- **Rationale**: Static segments take precedence over the dynamic `[tenantSlug]` segment, so system surfaces (`/onboarding`, `/admin`, `/`) can never be shadowed by a business slug. Keeping the admin behind a real `/admin` segment (instead of the `(admin)` route group used in 001) makes the authenticated/public boundary explicit and easy to guard.
- **Alternatives considered**: hosting each surface in a separate app/zone (rejected — overkill and breaks shared shell); putting the portal under `/book/[slug]` with the prefix duplicating the app (rejected — the gateway already supplies it); keeping the admin at the root and the portal elsewhere (rejected — collides with public slugs).

## R2. Onboarding flow, draft persistence and submission

- **Decision**: A client-rendered three-step wizard (`account → business → setup`) with per-step Zod validation and a **local-first draft** persisted on the client (storage behind a small seam), plus a single **Server Action** that provisions the tenant, owner and defaults atomically. Step navigation preserves data; the final submit is idempotent (a draft id / submission token prevents duplicates on retry).
- **Rationale**: Multi-step forms need client state, but the provisioning write must be server-side and transactional to guarantee slug uniqueness and defaults. Local-first matches the ecosystem principle (FR-013, SC-006) and lets an owner resume after a reload or connectivity drop.
- **Alternatives considered**: a pure server-rendered multi-page form with hidden fields (rejected — poor UX and fragile); persisting the draft server-side before completion (rejected — creates incomplete tenants and leaks partial data); one giant single-page form (rejected — the spec requires ordered steps).

## R3. Tenant and account model (Foundly Pass deferred)

- **Decision**: Model `Tenant` (business) and `User` (account) as plain TypeScript interfaces. A `User` has a role (`owner` in v1, extensible to `professional`) and references its tenant; a `Tenant` has one owner and a lifecycle status (`draft | active | suspended`). Foundly Pass SSO is treated as the future central identity: the wizard captures the owner identity/credentials into the local mock store, and the seam (`apps/book/src/shared/infra/auth.ts`) exposes a session with `userId` + `tenantId` so swapping to Foundly Pass later changes only that seam.
- **Rationale**: `specs/business-model.md` §3.3 makes Foundly Pass the single identity provider; building real auth now would be an unauthorized decision. Modelling the session seam keeps the module ready for SSO without coupling to it.
- **Alternatives considered**: integrating Foundly Pass now (rejected — external dependency not ratified for implementation); no account concept, tenant-only (rejected — FR-015/FR-016 need an owner identity and role).

## R4. Public URL (slug): generation, validation and reserved words

- **Decision**: Slug rules are a pure module (`shared/utils/slug.ts`): normalize to lowercase kebab-case (strip accents, collapse separators), validate against `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` (3–40 chars), reject a fixed **reserved list** (`admin`, `onboarding`, `api`, `www`, `app`, `public`, `static`, `assets`), and check uniqueness against the store. The wizard suggests a slug derived from the commercial name while allowing edits.
- **Rationale**: A unique, human-readable, collision-free public address is the core invariant of the portal (FR-008, FR-014, SC-003). A pure function is trivially unit-testable and shared by the wizard (live validation) and the provisioning action (authoritative check).
- **Alternatives considered**: UUIDs as addresses (rejected — poor UX and SEO); DB-level unique constraints only (rejected — no persistence yet, and the UI needs live feedback); no reserved words (rejected — allows shadowing system routes).

## R5. Public booking portal and reuse of the availability engine

- **Decision**: The portal's page is a **Server Component** that resolves the tenant by slug (404/unavailable state for unknown, suspended or unlicensed tenants) and loads its public services; the interactive slot picker and booking panel are a small client component that calls the existing availability engine (`shared/utils/computeAvailability.ts`) — reused unchanged — and a server action to create the appointment with `origin: 'online'`.
- **Rationale**: Availability/overlap rules already exist and are the single source of truth (001 §R3/R5); reusing them guarantees the portal offers exactly the slots the agenda can accept. Server-first rendering keeps the public page fast and SEO-visible.
- **Alternatives considered**: reimplementing availability for the portal (rejected — duplicate logic, inconsistent results); a fully client-rendered portal (rejected — worse first paint/SEO and more exposed data).

## R6. Access control and tenant scoping

- **Decision**: Introduce a thin `requireTenant` guard beside the existing `requireRole`: it resolves the session (from the store seam) and returns the bound `tenantId`, or redirects unauthenticated users to the registration entry point. Every admin query/action takes the tenant id from the session, never from the URL. The public portal reads are tenant-scoped by slug and filtered to active/licensed tenants.
- **Rationale**: FR-015–FR-017 and SC-008 require strict isolation; deriving the tenant from the session (not the request) prevents horizontal privilege escalation. Foundly Pass SSO is a future swap of the same seam.
- **Alternatives considered**: trusting a tenant id in the URL/route params (rejected — IDOR risk); per-route ad-hoc checks (rejected — easy to miss a screen).

## R7. Provisioning defaults from the wizard

- **Decision**: A pure `provision.ts` maps the wizard's step-3 configuration (default appointment duration, general hours) into the tenant's initial state: a default availability rule set (one rule per open weekday, split into a single interval) with the chosen granularity, plus a default service entry so the workspace is immediately usable. Currency defaults to `EUR` and the tenant gets a default business timezone (consistent with the existing 001 seeds).
- **Rationale**: SC-005 requires a ready-to-use workspace with no manual setup; keeping the mapping pure keeps it testable and independent of the store.
- **Alternatives considered**: starting with an empty workspace (rejected — violates SC-005 and worsens first-run experience); hard-coding hours in the view (rejected — not tenant-specific).

## R8. Persistence strategy — still deferred (not defined)

- **Decision**: Do **not** introduce any persistence technology. The store seam (`apps/book/src/shared/infra/store.ts`) is extended with `tenants`, `users` and `sessions` collections typed with the new interfaces, and remains the only module that reads/writes them. When `specs/architecture.md` ratifies storage, only this seam is replaced.
- **Rationale**: Same as 001 §R2 — storage was never ratified; introducing it now would be an unauthorized architectural decision and would leak storage concerns into domain/UI code.
- **Alternatives considered**: adding a database client (rejected — unauthorized); coupling the tenancy logic to storage (rejected — violates C2/C3).

## R9. Testing strategy

- **Decision**: **Vitest** for the pure tenancy logic (slug normalize/validate/reserved, tenant resolution, provisioning defaults) and for the Zod schemas; **Vitest + React Testing Library + `vitest-axe`** for the wizard steps, the admin guard and the public portal's unavailable/available states.
- **Rationale**: The risky, rule-heavy logic is pure and cheap to unit-test; the component tests cover the accessibility requirement (SC-007) and the isolation statements.
- **Alternatives considered**: only E2E (slow, poor signal for edge cases); no tests (rejected by the workflow gates).

## R10. UI composition and the admin shell

- **Decision**: The product page and wizard are composed exclusively from `@foundly/ui` primitives (`Card`, `Button`, `TextField`, `Typography`, `Stack`, `Container`, `Badge`, `DataTable`, `Chip`, `Modal`, `AlertDialog`). The admin dashboard reuses the Drawer shell already built in `001-book-admin-panel` (token-styled MUI structure + `@foundly/ui` primitives), now tenant-scoped. The public portal reuses the same design language with a minimal, booking-focused layout.
- **Rationale**: Satisfies SC-007/FR-017 (no ad-hoc brand styling) and keeps a single visual identity across the four surfaces. Reusing the shell avoids duplicating navigation/branding work.
- **Alternatives considered**: styling MUI directly across all surfaces (rejected by Principle VI); building a separate portal design (rejected — breaks ecosystem identity).

## Open items

None. All Technical Context unknowns are resolved; no `NEEDS CLARIFICATION` remains. The persistence strategy stays explicitly deferred to `specs/architecture.md`, and Foundly Pass SSO is captured as an external, future dependency behind the session seam.

**Doc alignment note**: this feature turns the shared multi-zone prefix into the product's route plan (`/book`, `/book/onboarding`, `/book/admin/*`, `/book/<slug>`). The mapping is consistent with `specs/architecture.md` §2; no global document amendment is required.
