# Implementation Plan: Foundly Book — Admin UX Hardening (Toasts, Loading, Moderation, Image Rules, Orphan Actions)

**Branch**: `016-admin-ux-hardening` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/016-admin-ux-hardening/spec.md`

## Summary

Harden the Foundly Book admin panel across five areas: (1) a greenfield **toast** system in `apps/book` (semantic kinds, dismissible, accessible, auto-hide); (2) **loading + double-submit prevention** on every create/edit form (gallery, professional, service, appointment) with auto-close and revalidation; (3) a **review-moderation surface** (`/admin/reviews`) consuming the new backend from `specs/api/015-review-moderation`; (4) **dimension/aspect rules** for the profile logo (square) and cover (banner); and (5) enabling the **orphan actions** — a real "Crear servicio" flow and fixing the "Nueva cita" submission so it persists. All data access stays in each module's `actions.ts`/`hooks.ts`; the UI never calls the transport or Server Actions directly (constitution §5.VI).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · Next.js 15.5 (App Router, React 19) · Node ≥ 20.

**Primary Dependencies**: `graphql-request`, `graphql-codegen`, `@foundly/ui`, `@supabase/ssr`, `zod`. **No new dependencies.**

**Storage**: PostgreSQL via `apps/api` over GraphQL (the client is storage-agnostic).

**Testing**: Vitest + RTL + vitest-axe; `tsc --noEmit`; `next build`; root ESLint.

**Target Platform**: Vercel multi-zone (book zone).

**Project Type**: Web application (Next.js server-first).

**Performance Goals**: reads resolved on the server; toasts and pending states are lightweight client state; no Core Web Vitals impact.

**Constraints**: strict TS, no `any`; Server-First; UI → `hooks.ts` only; codegen-only API DTOs; RSC boundary (serializable props only); design tokens via `@foundly/ui`; accessibility (WCAG) for toasts and moderation controls.

**Scale/Scope**: 5 user stories; touches `shared/components` (toaster + nav), `modules/gallery`, `modules/staff`, `modules/reviews` (admin surface), `modules/services`, `modules/agenda`, `modules/profile`, plus a new `/admin/reviews` route and a shared async-action hook.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/book/`; changes confined to `apps/book` (+ the SDL snapshot from `specs/api/015-review-moderation`).
- **Capa de datos por módulo (§5.VI)** — every new read/write goes in the module's `actions.ts` and is exposed via `hooks.ts` (`useFetchMyReviews`, `useSetReviewState`, `useDeleteReview`, `useCreateService`, …); UI forbidden from calling the transport/Server Actions directly.
- **Server-First (§5.II)** — the moderation list, profile editor and catalogs resolve their reads on the server; `hooks.ts` only for interactive mutations.
- **RSC boundary (§5.V / code-rules §8)** — client components (toaster, modals, moderation list) receive only serializable props; the toast provider is a client boundary mounted once.
- **Tipado estricto (§5.IV)** — codegen-only API types; domain types in `shared/types`; no `any`.
- **Design system (§6)** — `@foundly/ui` only; semantic colors from tokens; accessible checks green.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/book` with zero regressions.
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`; supports the trustworthy, polished product experience (`business-model.md` §2.3).

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/book/016-admin-ux-hardening/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-ux.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/shared/components/Toaster.tsx        # NEW ToastProvider + useToast (client)
apps/book/src/shared/hooks/useAsyncAction.ts        # NEW shared pending/error/toast helper (client)
apps/book/src/app/layout.tsx                        # mount <ToastProvider> (or admin layout)
apps/book/src/shared/components/AdminNavigation.ts  # + "Reseñas" nav item

apps/book/src/modules/reviews/                       # moderation surface (depends on api/015)
├── reviews.graphql                                  # + MyReviews / SetReviewState / DeleteReview
├── actions.ts                                        # + listMyReviews / setReviewState / deleteReview
├── hooks.ts                                          # + useFetchMyReviews / useSetReviewState / useDeleteReview
├── utils/schemas.ts                                  # + setReviewStateSchema / deleteReviewSchema
├── components/ReviewModerationList.tsx               # NEW list + filter + approve/reject/delete
├── ModerationView.tsx                                # NEW server view
└── tests/                                            # + moderation tests
apps/book/src/app/admin/reviews/page.tsx             # NEW thin route → ModerationView

apps/book/src/modules/services/                      # orphan "Crear servicio"
├── services.graphql (existing) / actions.ts          # + createService / updateService / deleteService
├── hooks.ts                                          # NEW useCreateService / useUpdateService / useDeleteService
├── utils/schemas.ts                                  # + serviceSchema
└── components/ServiceCatalog.tsx                     # real create modal + delete confirm + pending/refetch

apps/book/src/modules/agenda/components/Agenda.tsx   # fix startAt offset + pending + refetch + toast
apps/book/src/modules/gallery/components/GalleryManager.tsx  # pending + refetch + toast
apps/book/src/modules/staff/components/StaffManager.tsx      # pending + refetch + toast

apps/book/src/modules/profile/
├── utils/image-rules.ts                              # NEW avatar/cover rules + measurement helper
└── components/ProfileEditor.tsx                      # guidance + inline block + preview

apps/book/src/shared/types/tenancy.ts                # + ReviewState on Review; + Service input type
apps/book/codegen.schema.gql                          # versioned SDL snapshot (from API 015)
apps/book/src/shared/api/generated.ts                 # regenerated
```

**Structure Decision**: Canonical module data layer per constitution §5.VI. Toasts and the async-action helper are cross-cutting client utilities in `shared/` (no new dependency). Moderation extends the existing `reviews` module; services gains the missing `actions.ts`/`hooks.ts` surface; agenda/profile/gallery/staff are hardened in place.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
