# Implementation Plan: Foundly Book — Profile, Policies & Reviews (Admin + Public Portal)

**Branch**: `014-profile-policies-reviews` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/014-profile-policies-reviews/spec.md`

## Summary

Make `/admin/profile` a real editable form (identity, contact/social, logo/cover, "About", and a reservation/cancellation **policies** list) that persists through the session-aware transport, and feed the public mini-site (`About`, contact/address, policies, and a **reviews** list with aggregate rating) from the backend. Visitors can submit a review from the public page. Depends on the API surface delivered by `specs/api/013-profile-policies-reviews`.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · Next.js 15.5 (App Router, React 19) · Node ≥ 20.

**Primary Dependencies**: `graphql-request`, `graphql-codegen`, `@foundly/ui`, `@supabase/ssr`, `zod`. **No new dependencies.**

**Storage**: PostgreSQL via `apps/api` over GraphQL.

**Testing**: Vitest + RTL + vitest-axe; `tsc --noEmit`; `next build`; root ESLint.

**Target Platform**: Vercel multi-zone (book zone).

**Project Type**: Web application (Next.js server-first).

**Performance Goals**: profile/reviews resolved on the server for the initial render; no Core Web Vitals regression.

**Constraints**: strict TS, no `any`; Server-First — profile updates are Server Actions, the UI never calls the transport/Server Actions directly (only via `hooks.ts`); codegen-only API DTOs; RSC boundary (serializable props only).

**Scale/Scope**: profile module (`actions.ts`/`hooks.ts`/`utils/schemas.ts`/`components/ProfileEditor.tsx`/`ProfileView.tsx`/tests); a reviews module for public submission (`actions.ts`/`hooks.ts`/`components/ReviewForm.tsx`/`reviews.graphql`); `public-booking` aggregate read (profile + policies + reviews/rating); codegen snapshot sync.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/book/`; changes confined to `apps/book`.
- **Capa de datos por módulo (§5.VI)** — data access in `actions.ts`, interactive updates exposed via `hooks.ts` (`useFetchProfile`, `useUpdateProfile`, `useSubmitReview`); UI forbidden from calling the transport/Server Actions directly.
- **Server-First (§5.II)** — reads resolved in Server Components; `hooks.ts` only for interactive save/review submission.
- **RSC boundary (§5.V / code-rules §8)** — client components receive only serializable props.
- **Tipado estricto (§5.IV)** — codegen-only API types; domain types in `shared/types`; no `any`.
- **Design system (§6)** — `@foundly/ui` only; accessible checks green.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/book` with zero regressions.
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/book/014-profile-policies-reviews/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── profile-ui.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/modules/
├── profile/
│   ├── profile.graphql                     # Profile query (tenant profile incl. policies) + UpdateBusinessProfile mutation
│   ├── actions.ts                          # getProfile (apiRequestAdmin) + updateProfile Server Action
│   ├── hooks.ts                            # useFetchProfile / useUpdateProfile
│   ├── utils/schemas.ts                    # zod: URLs, slug, bounded text, policies list
│   ├── components/ProfileEditor.tsx        # editable form (identity, contact/social, About, policies list)
│   ├── ProfileView.tsx                     # server: session tenant → getProfile
│   └── tests/                              # unit (schemas/actions) + RTL (ProfileEditor)
├── reviews/                                # NEW module (public submission)
│   ├── reviews.graphql                     # Reviews query (summary) + AddReview mutation
│   ├── actions.ts                          # submitPublicReview Server Action
│   ├── hooks.ts                            # useSubmitReview
│   ├── components/ReviewForm.tsx
│   └── tests/
├── public-booking/
│   └── actions.ts                          # getPublicBusinessRemote: + policies + reviews/rating
apps/book/src/app/admin/profile/page.tsx    # unchanged thin route rendering <ProfileView/>
apps/book/codegen.schema.gql                # versioned SDL snapshot (from API 013)
shared/types/tenancy.ts                     # PortalPolicy / Review / Tenant (existing)
```

**Structure Decision**: Canonical data modules (profile for editing; reviews for public submission); the public aggregate read is layered onto `public-booking` (no new route). No new packages.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
