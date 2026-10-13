# Implementation Plan: Admin Authentication, Session Protection & Account Security

**Branch**: `009-admin-auth` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/009-admin-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Add the missing access lifecycle to `apps/book` (Next.js 15 / React 19): a real **sign-in** screen (`/login`) and **sign-out** for existing owners, **route protection** for `/admin/*` (redirect unauthenticated users to `/login`) with auth-page guarding (signed-in users leave `/login`), a **prominent public-page link** in the admin shell built from the owner's slug, and a **password change** section. Authentication reuses the existing Supabase Auth cookie session (`@supabase/ssr`) already wired in `middleware.ts` and `shared/infra/supabase/*`, plus a **local auth seam** (httpOnly cookie re-validated against the in-memory store) so the app remains runnable without a live identity provider. Crucially, the current auto-authenticated fallback (`getEffectiveSession() ?? store.sessions[0]`) is removed so the guard genuinely denies access. Quality gates (`typecheck`, `test`, `build`) must pass with zero regressions.

## Technical Context

**Language/Version**: TypeScript strict · Next.js 15.5.27 · React 19.3 · Node.js ≥ 20 (npm workspaces monorepo).

**Primary Dependencies**: existing `@supabase/ssr` + `@supabase/supabase-js` (session/sign-in/out/password), `next` middleware, `zod` (validation), `@foundly/ui` (UI). **No new runtime dependencies.**

**Storage**: Supabase Auth holds the identity (email + password) and the session cookie; business/tenant data is read from the existing in-memory seam (`shared/infra/store.ts`) for this feature (the API migration is feature 008). No direct DB access from `apps/book`.

**Testing**: book — Vitest + RTL + `vitest-axe` (`npm run test -w @foundly/book`), `tsc --noEmit` (`npm run typecheck -w @foundly/book`), `next build` (`npm run build -w @foundly/book`). Root lint: `npm run lint`.

**Target Platform**: Vercel Multi-Zone — book zone; middleware runs on the Edge runtime; auth actions run on the Node server runtime.

**Project Type**: Web application (Next.js server-first; Server Actions + Route Handlers).

**Performance Goals**: Standard web-app behaviour — sign-in completes in the order of seconds under normal network with a clear pending state; no Core Web Vitals regression (constitution §5.III).

**Constraints**: `strict: true`, no `any` (constitution §5.IV); **Server-First** — auth mutations are Server Actions, the bearer/session never ships to the browser bundle (§5.II); **RSC boundary** — server components must not pass functions to client components (constitution §5.V, `code-rules.md` §8); `@foundly/ui` only, no ad-hoc styling (§6); secrets never in the repo; admin data scoped from the session, never the URL.

**Scale/Scope**: one owner per business (single-tenant MVP); 3 new surfaces (`/login`, `/admin/seguridad`, admin shell additions); small, independent slices.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **SDD (§5.I)** — "No spec, no code": spec exists (`specs/book/009-admin-auth/spec.md`); this plan is the design artifact; tasks are generated downstream.
- **Dominio (§2.III)** — Spec lives in `specs/book/009-admin-auth`; all changes are book-scoped (`apps/book`). No API/backend behavioural change is required.
- **Server-First (§5.II)** — Sign-in/out and password change are Server Actions; the only new client components are the login form, the password form and the shell's logout/link affordances (interaction-justified).
- **RSC boundary (§5.V / `code-rules.md` §8)** — New server components pass only serializable props (strings/booleans/`ReactNode`) to client components; server actions are exposed via `'use server'`; no `sx`-function or handler crosses the boundary from a server component.
- **Tipado estricto (§5.IV)** — Zod schemas for `login` and `passwordChange`; typed `ActionResult`; session types reused verbatim.
- **Design system (§6)** — All new surfaces use `@foundly/ui` primitives and tokens.
- **Envs & secrets (architecture.md)** — Reuses the existing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; **no new env vars** and no secret committed.
- **Gates (§3.I)** — `typecheck`, `test` and `build` for `@foundly/book` must pass with zero regressions (FR/SC-009).

**Pre-Phase-0 check**: PASS (no violations). **Post-Phase-1 re-check**: PASS — the design adds only `apps/book` surfaces + infra, introduces no new project/package, no monorepo cycle, no `any`, and no duplicate shared logic; it removes an insecure fallback rather than adding complexity.

## Project Structure

### Documentation (this feature)

```text
specs/book/009-admin-auth/
├── plan.md                    # This file (/speckit.plan command output)
├── research.md                # Phase 0 output — decisions with rationale/alternatives
├── data-model.md              # Phase 1 output — entities, validation, states
├── quickstart.md              # Phase 1 output — validation guide
├── contracts/                 # Phase 1 output — interface contracts
│   ├── auth-session.contract.md
│   ├── route-guard.contract.md
│   └── admin-account.contract.md
└── tasks.md                   # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/book/src/
├── middleware.ts                              # EXTENDED: refresh + guard /admin/* and /login
├── app/
│   ├── login/page.tsx                         # NEW: /login route (server) → LoginView; redirect if signed in
│   └── admin/
│       ├── layout.tsx                         # CHANGED: redirect to /login; pass tenantName + publicHref
│       └── seguridad/page.tsx                 # NEW: /admin/seguridad route (server) → SecurityView
├── modules/
│   ├── auth/
│   │   ├── LoginView.tsx                       # server view (composition + guard)
│   │   └── components/LoginForm.tsx            # 'use client' — email/password form
│   └── security/
│       ├── SecurityView.tsx                    # server view (composition + guard)
│       └── components/PasswordForm.tsx         # 'use client' — current/new/confirm form
└── shared/
    ├── components/
    │   ├── AdminShell.tsx                      # CHANGED: public-page link + sign-out button
    │   └── AdminNavigation.ts                  # CHANGED: add "Seguridad" secondary nav item
    ├── infra/
    │   ├── auth.ts                             # CHANGED: remove auto-session; keep requireRole/requireTenant
    │   ├── authServer.ts                       # CHANGED: getEffectiveSession = live ?? local cookie (no seed)
    │   ├── session.ts                          # NEW: local session cookie helpers (server-only)
    │   ├── sessionSchemas.ts                   # NEW: Zod loginSchema + passwordChangeSchema
    │   ├── sessionActions.ts                   # NEW: 'use server' signIn / signOut / changePassword
    │   ├── authGuard.ts                        # NEW: edge-safe guard helpers for middleware
    │   └── store.ts                            # CHANGED: stop seeding an authenticated session
    └── tenancy/queries.ts                      # CHANGED: getAdminTenantId redirects to /login
```

**Structure Decision**: All work is contained in `apps/book`, split as **infra** (`shared/infra/session*.ts`, `authGuard.ts`, `auth*.ts`), **UI modules** (`modules/auth`, `modules/security`) and **thin routes** (`app/login`, `app/admin/seguridad`), following the repo's `rutas delgadas + modules/ + shared/` pattern (constitution §7). `shared/` never imports from `modules/`; the shell's sign-out imports the `'use server'` action from `shared/infra`. No new top-level directories or packages are introduced.

## Complexity Tracking

> Not required: Constitution Check passes with **no violations**, so no complexity justifications are needed. The dual auth path (live Supabase + local dev seam) is inherent to keeping the app runnable without a configured identity provider, not avoidable structure.
