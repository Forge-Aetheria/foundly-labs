# Phase 0 — Research: Admin Authentication, Session Protection & Account Security

**Feature**: `specs/book/009-admin-auth` | **Date**: 2026-10-12

This document resolves the open technical decisions for the feature. There were **no `NEEDS CLARIFICATION`** items in the plan's Technical Context; the decisions below fix the approach and record the alternatives considered.

---

## R1 — Sign-in transport: Server Action with the server Supabase client

- **Decision**: The sign-in form (a client component) calls a **Server Action** (`signIn`) that uses the existing per-request `createServerSupabaseClient()` and calls `supabase.auth.signInWithPassword({ email, password })`. The cookie adapter in `shared/infra/supabase/server.ts` persists the session cookies; the action then redirects to the admin panel.
- **Rationale**: Keeps Server-First (constitution §5.II): the access token never reaches the browser bundle, the cookie is written server-side, and the existing refresh middleware remains the single refresh point. Reuses the 008 session infra unchanged.
- **Alternatives considered**:
  - **Browser client sign-in** (`createBrowserSupabaseClient().auth.signInWithPassword`) — rejected: ships auth logic + token handling to the browser and duplicates the cookie lifecycle the server adapter already owns.
  - **Route Handler (`/auth/sign-in`)** — rejected: a Server Action is simpler, colocated with validation, and matches the existing action/`ActionResult` pattern.

## R2 — Route protection: middleware guard + server backstops

- **Decision**: Protect routes at **two layers**:
  1. **Middleware** (`src/middleware.ts`) — after the existing session refresh, compute `authenticated` and redirect: `/admin/*` without a session → `/login`; `/login` with a session → `/admin/agenda`.
  2. **Server backstops** — the admin layout and `getAdminTenantId` redirect to `/login`; the `/login` page redirects signed-in users to `/admin/agenda`.
- **Rationale**: Middleware gives an early, uniform redirect for all `/admin/*` (the spec's explicit requirement) and covers not-yet-rendered navigations; the server backstop protects against middleware gaps and keeps tenant scoping authoritative from the session. Matches the existing middleware's `getClaims()` (Edge-safe JWKS verification) already used for refresh.
- **Bounded auth calls (feature 012 follow-up)**: the middleware's `getClaims()` and the server `getClaims()`/`getSession()` are wrapped in `withTimeout` (`shared/auth/withTimeout.ts`, `AUTH_CALL_TIMEOUT_MS`) so a slow/unreachable identity provider degrades to "no session" instead of hanging every request until the platform timeout.
- **Alternatives considered**:
  - **Layout guard only** — rejected: the layout is a server component and cannot stop a request before rendering; the spec explicitly asks for middleware protection.
  - **Middleware only** — rejected: defence-in-depth and the "session ends mid-panel" edge case are better handled with a server-side decision.

## R3 — Local auth seam and removal of the auto-authenticated session

- **Decision**:
  - **Live mode** (`NEXT_PUBLIC_SUPABASE_*` present): the session comes from Supabase verified claims (`getClaims()`), as today.
  - **Local mode** (no live env): a `signIn` against the in-memory seam validates `email` + password against `store.users[].credential` and sets an **httpOnly session cookie** containing only the `userId`; every server read re-resolves the user from the store to derive `role`/`tenantId` (the cookie is not trusted as the source of truth). `signOut` clears it.
  - `getEffectiveSession()` becomes **`live ?? localCookieSession`** and **no longer falls back to `store.sessions[0]`**. The seeded `store.sessions` is emptied so the app is genuinely unauthenticated until someone signs in.
- **Rationale**: The spec's Assumption is explicit: _the current in-memory demo-session fallback MUST NOT authenticate a user who has not signed in_. At the same time, the app must remain runnable and testable without a configured identity provider, so a minimal local seam replaces the "always signed in" behaviour. Re-resolving from the store on every read means the cookie cannot be forged into a different tenant.
- **Alternatives considered**:
  - **Keep the seeded session** — rejected: defeats the entire guard (admin was reachable without login).
  - **Require Supabase for local dev** — rejected: blocks offline/local development and the existing test suite; contradicts the current graceful-fallback posture (feature 008).
  - **Signed/HMAC local cookie** — rejected as unnecessary: the cookie carries only a `userId` and is re-validated against the store, so no secret is needed and none is committed.

## R4 — Public slug quick link target

- **Decision**: Render a prominent link in the admin shell to the owner's public booking page using the app-internal public route `/{slug}` (the tenant portal resolved by `getTenantBySlug`), labelled with the public URL. Hidden (non-actionable) when the owner has no slug.
- **Rationale**: Consistent with the current routing (`app/[tenantSlug]/page.tsx`, feature 003) and with the path-based public URL shown elsewhere (`foundlylabs.lat/book/{slug}`). No new routing or DNS.
- **Alternatives considered**:
  - **Subdomain link** (`{slug}.foundlylabs.com`) — rejected/out of scope per the spec Assumption (subdomain configuration is not part of this feature).

## R5 — Password change flow

- **Decision**: A Server Action `changePassword` validates with Zod (current + new + confirmation, policy: ≥8 chars with letters and numbers), then:
  - **Live mode**: re-authenticate the current password via `signInWithPassword` (proves ownership) and, on success, `supabase.auth.updateUser({ password: newPassword })`.
  - **Local mode**: verify the current password against the store credential and update it.
  - Returns a typed `ActionResult`; the form shows success/error inline.
- **Rationale**: Requires proof of the current password (spec FR-010/FR-011) without a bespoke backend, and reuses the identity provider's own update capability (spec requirement). Local mode keeps parity for development/tests.
- **Alternatives considered**:
  - **`updateUser` without current-password re-auth** — rejected: does not satisfy FR-011 (reject an incorrect current password).
  - **Email reset link** — out of scope (no email delivery configured).

## R6 — UI composition and RSC boundary compliance

- **Decision**: New surfaces use `@foundly/ui` (`Container`, `Card`, `Stack`, `Typography`, `TextField`, `Button`). Client components are only the forms and shell affordances; server components pass only serializable props. Server actions are exposed through a `'use server'` module and imported directly by the client components (not passed as props).
- **Rationale**: Satisfies design-system rules (§6) and the RSC boundary rule (§5.V / `code-rules.md` §8). Directly addresses the class of bug that motivated that rule: no function values cross from server to client.
- **Alternatives considered**:
  - **Passing actions as props from the server layout to the shell** — rejected: valid but unnecessary indirection; importing the `'use server'` action is simpler and keeps `shared/` free of `modules/` imports.

## R7 — Session cookie and route constants

- **Decision**: Introduce named constants for the local session cookie (e.g. `foundly_book_session`, `httpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production) and for the auth routes (`/login`, default post-login `/admin/agenda`). Middleware imports only edge-safe modules (`shared/infra/supabase/*`, `shared/infra/authGuard.ts`) — never the in-memory store.
- **Rationale**: A single source for cookie/route names avoids drift between the middleware, actions and server helpers; keeping middleware free of the store respects the Edge runtime boundary (Edge and Node runtimes do not share process memory).
- **Alternatives considered**:
  - **Reading the store in middleware** — rejected: Edge runtime isolation means the store instance differs from the server runtime, so it cannot validate the local session there; middleware checks cookie presence only, and server components perform the authoritative re-validation.
