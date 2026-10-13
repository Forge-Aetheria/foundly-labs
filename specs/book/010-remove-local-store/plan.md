# Implementation Plan: Remove Local Store & Go Server/DB-Only

**Branch**: `010-remove-local-store` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/010-remove-local-store/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Delete the in-memory store (`apps/book/src/shared/infra/store.ts`) and route every persisted read/write to the Foundly API/DB. Modules whose backend already exists (services, team, availability, appointments, tenancy, auth) are connected immediately; modules with no backend counterpart (business gallery, policies, reviews) render a clean empty state with no mocks. The local auth seam (cookie + seeded users/sessions) is removed; authentication is Supabase-only. Failures surface as visible errors — no silent fallbacks.

## Technical Context

**Language/Version**: TypeScript strict · Next.js 15.5.27 · React 19.3 · Node ≥ 20.

**Primary Dependencies**: existing `graphql-request` transport (`shared/infra/apiClient.ts`), existing remote repositories (`remoteCatalog.ts`, `remoteTenancy.ts`), `@supabase/ssr` session, `@foundly/ui`. **No new dependencies.**

**Storage**: PostgreSQL via `apps/api` (GraphQL). The book accesses it exclusively over HTTP; no direct DB access.

**Testing**: Vitest + RTL + vitest-axe; `tsc --noEmit`; `next build`; root ESLint.

**Target Platform**: Vercel multi-zone (book zone); API as its own project.

**Project Type**: Web application (Next.js server-first).

**Performance Goals**: standard web-app; no Core Web Vitals regression.

**Constraints**: strict TS, no `any`; Server-First (all mutations are Server Actions; client components never read/write persisted data); `@foundly/ui` only; no secrets in the repo.

**Scale/Scope**: single tenant per owner; ~22 production files + ~11 test files touch the store.

## Constitution Check

_GATE: Must pass before Phase 0. Re-check after Phase 1._

- **SDD (§5.I)** — spec + plan exist; tasks downstream.
- **Dominio (§2.III)** — spec in `specs/book/`; only `apps/book` changes (no new API surfaces).
- **Server-First (§5.II)** — all data access moves to the server; mutations become Server Actions.
- **RSC boundary (§5.V / `code-rules.md` §8)** — server components pass only serializable props.
- **Tipado estricto (§5.IV)** — typed DTO↔domain mappers; no `any`.
- **Design system (§6)** — surfaces keep `@foundly/ui`; empty states use the design system.
- **Gates (§3.I)** — build/typecheck/test/lint must pass with zero regressions.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/book/010-remove-local-store/
├── plan.md
├── spec.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/book/src/
├── shared/
│   ├── infra/
│   │   ├── store.ts                 # DELETED
│   │   ├── session.ts               # DELETED (local auth seam)
│   │   ├── sessionActions.ts        # live-only signIn/signOut
│   │   ├── securityActions.ts       # live-only changePassword
│   │   ├── auth.ts                  # remove getCurrentSession
│   │   ├── authServer.ts            # getEffectiveSession = live only
│   │   ├── remoteCatalog.ts         # (existing) services/team
│   │   ├── remoteAvailability.ts    # NEW: availability read/write
│   │   ├── remoteAppointments.ts    # NEW: appointments read/write
│   │   └── remoteTenancy.ts         # + tenant by id / current tenant
│   ├── tenancy/queries.ts           # API-backed
│   └── utils/tenant-scope.ts        # session-derived tenant id
├── modules/
│   ├── onboarding/utils/            # server-only; provisionLocal DELETED
│   ├── services/utils/queries.ts    # remote-only
│   ├── staff/utils/{queries,actions}.ts   # remote-only + server actions
│   ├── availability/utils/{queries,actions}.ts  # remote rules; blocks empty
│   ├── agenda/utils/{queries,actions}.ts + AgendaView.tsx  # remote appointments
│   ├── gallery/utils/{queries,actions}.ts # empty state, no mocks
│   ├── profile/utils/{queries,actions}.ts # empty state (no backend)
│   └── public-booking/utils/{queries,actions}.ts # API-backed
└── app/**                            # guards/redirects unchanged
```

**Structure Decision**: All work is in `apps/book`. New remote transports live in `shared/infra/`; module `utils/` become server-only. No new packages; no backend changes (gallery/policies/reviews render empty).

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
