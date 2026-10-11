# Contract: Route Map & access guards (Foundly Book)

**Feature**: `specs/book/002-onboarding-and-tenant-flow/` | **Date**: 2026-10-08

Fixes the module's four surfaces and the access boundary between public and private routes. It is a UI contract for `apps/book`; the `/book` public prefix is supplied by the multi-zone gateway (`specs/architecture.md` §2).

## Route map

| Surface           | Public URL         | Internal App Router path | Access        | Shell                 |
| ----------------- | ------------------ | ------------------------ | ------------- | --------------------- |
| Product page      | `/book`            | `/`                      | public        | marketing layout      |
| Onboarding wizard | `/book/onboarding` | `/onboarding`            | public        | wizard layout         |
| Private dashboard | `/book/admin/*`    | `/admin/*`               | authenticated | `AdminShell` (Drawer) |
| Public booking    | `/book/<slug>`     | `/[tenantSlug]`          | public        | portal layout         |

**Rules**:

- Static segments (`/`, `/onboarding`, `/admin/*`) MUST take precedence over the dynamic `[tenantSlug]` segment; reserved slugs MUST also be rejected at creation so a future tenant can never shadow a system surface (FR-006).
- `/admin/*` is the only authenticated surface. Its layout (`apps/book/src/app/admin/layout.tsx`) MUST run the `requireTenant` guard and render the `AdminShell`; unauthenticated access redirects to `/onboarding` (FR-016).
- The public portal resolves the tenant from `[tenantSlug]`; unknown, `draft` or `suspended` tenants render a "not available" state and MUST NOT expose data (FR-017).
- Booking on the portal creates an appointment with `origin: 'online'` (FR-018) and respects the availability engine.
- All four surfaces MUST render over the module's continuous brand canvas (`004-book-brand-canvas`): the root layout (`apps/book/src/app/layout.tsx`) applies `.book-app-canvas` to `<body>`, and no surface wrapper paints an opaque full-screen background that hides it.

## Guards

- `requireTenant(session): ActionResult<Session>` — rejects `UNAUTHENTICATED` / `FORBIDDEN`, mirrors the existing `requireRole` and derives `tenantId` from the session.
- Tenant scoping is enforced in every admin query/action; the URL never supplies the tenant id (C4, SC-008).

## Verification

- Route tests: `/admin/*` without a session redirects; `/onboarding` and `/` are public; reserved slugs are rejected; a random `[tenantSlug]` either resolves to an active tenant or renders the unavailable state.
- Isolation tests: a session of tenant A cannot read tenant B data.
