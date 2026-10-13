# Implementation Plan: Centralized API Error Handling & Session Expiry

**Branch**: `012-centralized-api-errors` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/012-centralized-api-errors/spec.md`

## Summary

Move error presentation out of individual components into a central layer. A pure classifier (`error-surface.ts`) maps every `ErrorCode` to a **surface** (session/transient/inline) and to a localized message, so the raw provider text (`Unauthenticated`) never reaches the UI. A session-aware transport (`apiRequestAdmin`) injects the bearer token and routes missing-token/`UNAUTHENTICATED` failures to a global session-expiry route that clears the Supabase session and redirects to `/login?reason=session-expired`. Transient section-load failures render a reusable modal (`ApiErrorDialog`). Sign-in now verifies the backend accepts the freshly issued token via a new `viewer` query, surfacing mismatches on `/login`.

## Technical Context

**Language/Version**: TypeScript strict · Next.js 15.5.27 · React 19.3 · Node ≥ 20.

**Primary Dependencies**: existing `graphql-request` transport, `@supabase/ssr` session, `@foundly/ui`, `graphql-codegen` (`ViewerDocument`). **No new dependencies.**

**Storage**: PostgreSQL via `apps/api` (GraphQL); no direct DB access.

**Testing**: Vitest + RTL + vitest-axe; `tsc --noEmit`; `next build`; root ESLint.

**Target Platform**: Vercel multi-zone (book zone).

**Project Type**: Web application (Next.js server-first).

**Performance Goals**: no Core Web Vitals regression; the session consistency check is a single lightweight query at sign-in.

**Constraints**: strict TS, no `any`; Server-First (mutations are Server Actions; UI never calls the transport directly); `@foundly/ui` only.

**Scale/Scope**: ~10 production files + ~5 test files; one new route handler; one new GraphQL operation.

## Constitution Check

_GATE: Must pass before Phase 0. Re-check after Phase 1._

- **SDD (§5.I)** — spec + plan exist; tasks downstream.
- **Dominio (§2.III)** — spec in `specs/book/`; only `apps/book` changes.
- **Server-First (§5.II)** — data access stays on the server; the session handler is a route handler.
- **Capa de datos por módulo (§5.VI)** — classification lives in `shared/api`; modules keep `actions.ts`/`hooks.ts` and only consume the session-aware transport.
- **RSC boundary (§5.V / `code-rules.md` §8)** — client components receive only serializable props (`ApiErrorDialog` takes a string).
- **Tipado estricto (§5.IV)** — typed `ErrorSurface`/`ErrorCode`; no `any`.
- **Design system (§6)** — alerts use `@foundly/ui` primitives.
- **Gates (§3.I)** — build/typecheck/test/lint must pass with zero regressions.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/book/012-centralized-api-errors/
├── plan.md
├── spec.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/book/src/
├── shared/api/
│   ├── error-surface.ts        # NEW: ErrorSurface classification + localized messages
│   ├── client.ts               # mapActionError → localized, code-based messages
│   ├── admin-request.ts        # NEW: apiRequestAdmin (bearer + session redirect)
│   └── tests/{error-surface,admin-request}.test.ts
├── shared/auth/authConstants.ts    # + SESSION_EXPIRED_ROUTE / reason
├── shared/components/ApiErrorDialog.tsx  # NEW: clean modal alert
├── app/
│   ├── auth/session-expired/route.ts     # NEW: clear session → /login?reason=
│   └── login/page.tsx                    # reads the expiry reason
└── modules/
    ├── auth/{actions.ts,hooks?}, components/LoginForm.tsx, LoginView.tsx, auth.graphql
    ├── services/{actions.ts,components/ServiceCatalog.tsx}
    ├── staff/{actions.ts,components/StaffManager.tsx}
    ├── agenda/{actions.ts,components/Agenda.tsx}
    ├── availability/components/AvailabilityEditor.tsx
    ├── profile/components/ProfileEditor.tsx
    └── public-booking/actions.ts     # precise CONFLICT message (spot taken)
```

**Structure Decision**: All work is in `apps/book`. The reusable, framework-light classification lives in `shared/api`; the session handler is a server route handler; modules keep their `actions.ts`/`hooks.ts` contract and simply use the session-aware transport. No new packages.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
