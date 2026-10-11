# Phase 0 — Research: Foundly Book — Public Portal Mini-Site

**Feature**: `specs/book/003-public-portal-minisite/` | **Date**: 2026-10-09

Resolves the technical unknowns from the plan's Technical Context. Each item records the decision, rationale and alternatives considered.

## R1. Portal profile data model

- **Decision**: Extend `Tenant` with optional portal-facing profile fields — `bio` (string|null), `address` (string|null), `phone` (string|null), `cover` (string|null, image ref), `social` (`{ instagram?: string; whatsapp?: string } | null`) — and add a small `PortalPolicy` entity (`{ title, body }`) as a tenant-owned collection. All seeded as mock data in the store seam.
- **Rationale**: The spec (FR-001…FR-004) needs these fields, but the ecosystem's persistence is undefined; keeping them in the seam matches 002 and keeps the swap path trivial.
- **Alternatives considered**: a CMS/content model in the landing zone (rejected — cross-app coupling and no storage); hard-coding them in components (rejected — violates separation of content, and schema-less).

## R2. Specialists as active resources

- **Decision**: A specialist is an **active `Resource`** of the tenant, extended with optional `role`, `avatar` and `bio` metadata. The Equipo tab lists them; the booking flow's specialist step applies when the tenant has more than one active specialist (skipped otherwise, FR-010).
- **Rationale**: The domain already models resources; reusing them avoids a parallel entity and keeps appointments/resource scoping consistent.
- **Alternatives considered**: a separate `Specialist` entity (rejected — duplicated bookable model); forcing the step always (rejected — FR-010 requires skip when not applicable).

## R3. Tabs without a library primitive

- **Decision**: Implement accessible tabs with `@foundly/ui` `Button` pills as controllers and `aria` semantics (`role="tablist"/`tab`/`tabpanel"`, `aria-selected`, keyboard arrows) managed manually; content renders per active tab.
- **Rationale**: `@foundly/ui` exposes no `Tabs` primitive and the constraint says to use only `@foundly/ui`. A small accessible controller built from primitives is low-risk and testable.
- **Alternatives considered**: MUI `Tabs` directly (rejected by constraint C1); adding a `Tabs` primitive to `@foundly/ui` (deferred — out of scope for this feature).

## R4. Guided booking flow container

- **Decision**: The 4-step flow lives inside an `@foundly/ui` `Modal` (the design system's overlay primitive) with a local step state machine (`specialist → slots → client → confirm`). Client data is kept in state so a mid-flow `CONFLICT` does not lose entries (FR-015), and the modal is hydration-safe (step state lives client-side only).
- **Rationale**: A modal keeps the mini-site context visible, satisfies "Modal/Drawer/Stepper" without new primitives, and keeps the flow isolated.
- **Alternatives considered**: MUI `Drawer` (rejected — not in `@foundly/ui` and no benefit for a centered flow); full-page stepper route (rejected — breaks mini-site context).

## R5. Per-specialist slots (availability reuse)

- **Decision**: Extend the existing `getOfferedSlots` to accept an optional `resourceId` (currently it resolves the tenant's first resource) and expose `fetchOfferedSlots` by specialist. The server-side `bookPublicAppointment` already enforces conflicts per resource; the portal flow selects a specialist before fetching slots.
- **Rationale**: FR-011/FR-014 require slots and conflicts scoped to the specialist; the engine itself is unchanged (pure, per resource).
- **Alternatives considered**: computing slots client-side (rejected by C2); fetching all specialists' slots (rejected — wasteful).

## R6. Current-rate display

- **Decision**: The portal's service cards resolve the tenant's **current applicable `Rate`** server-side (same effective-period rule as the admin snapshot) and show it formatted in the tenant currency.
- **Rationale**: FR-017 requires the current price; reuse avoids duplicating rate logic.
- **Alternatives considered**: hard-coding prices (rejected — diverges from rates); client-side rate resolution (rejected — data lives server-side).

## R7. Policies and weekly hours

- **Decision**: The Información & Políticas tab renders the tenant's `businessHours` (per weekday, open/closed + interval) and a seeded `PortalPolicy` list (booking/cancellation). Missing policies show the fallback copy "Consulta las condiciones con el negocio".
- **Rationale**: FR-008 needs explicit, readable policies and hours; defaults avoid empty UI.
- **Alternatives considered**: composing policies from appointment lifecycle rules (rejected — too rigid for free-form tenant copy).

## R8. Accessibility and responsive behaviour

- **Decision**: All interactive controls keep a pill `Button` shape (min height 44 via the theme override) with visible focus; tabs implement the WAI-ARIA tabs pattern; the layout uses a single column on mobile with `overflow-hidden`-safe bands and `flexWrap` rows, so there is no horizontal scroll (FR-019/FR-020, SC-005/SC-007).
- **Rationale**: The constitution and spec demand keyboard operability and no overflow; the theme's pill buttons already provide touch targets.
- **Alternatives considered**: relying on MUI defaults (rejected — Tabs/Stepper absent); custom JS drag/scrolling (rejected — hurts a11y).

## R9. Testing strategy

- **Decision**: Vitest for the portal query contract (profile shape, current rate, specialist list, policy/hours) and the booking action behavior (`CONFLICT`, origin online); Vitest + RTL + `vitest-axe` for `PublicPortal`, tabs, `ServiceCard`, `SpecialistsTab`, `PoliciesTab` and the 4-step `BookingFlow` (each step, skip specialist, conflict-keeps-data, confirmation summary).
- **Rationale**: SC-001…SC-007 are measurable; the flow is the riskiest part and deserves step-by-step component tests.
- **Alternatives considered**: only E2E (slow, poor signal); no a11y tests (rejected by SC-005).

## R10. UI composition and tokens

- **Decision**: Compose hero, tabs, cards and the modal exclusively from `@foundly/ui` primitives with theme tokens: pill buttons (already pill in the theme), `#6C5CE7` primary, `#FAF8FF` canvas, zinc dividers/text; avatars are initial circles built from `Stack` + `Typography` (no `Avatar` primitive yet).
- **Rationale**: Guarantees SC-006 and the design-system principle; pill buttons and bold typography already ship in the theme.
- **Alternatives considered**: introducing MUI `Avatar`/`Tabs`/`Stepper` (rejected by C1); adding new primitives to `@foundly/ui` (deferred — tracked as a note for the shared-ui roadmap).

## Open items

None. All Technical Context unknowns are resolved; no `NEEDS CLARIFICATION` remains. Persistence stays explicitly deferred to `specs/architecture.md`.

> **Shared-ui roadmap note**: an optional follow-up could add `Tabs`, `Stepper` and `Avatar` primitives to `@foundly/ui` so this pattern moves out of app code.
