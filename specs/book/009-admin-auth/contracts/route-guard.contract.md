# Contract: Route Guard (admin protection & auth-page guarding)

**Feature**: `specs/book/009-admin-auth` | **Date**: 2026-10-12

## Objective

Guarantee that private admin surfaces require a valid, business-bound session and that the auth surface is hidden from signed-in users, at the Edge (middleware) and on the server (layouts/pages).

## Route matrix

| Route(s)              | Access                | Unauthenticated     | Authenticated                     |
| --------------------- | --------------------- | ------------------- | --------------------------------- |
| `/admin/*`            | Private (owner/admin) | redirect → `/login` | render (scoped to session tenant) |
| `/login`              | Public auth page      | render sign-in      | redirect → `/admin/agenda`        |
| `/` , `/[tenantSlug]` | Public                | render              | render                            |
| `/onboarding`         | Public (registration) | render              | render                            |

## Middleware (`src/middleware.ts`)

After the existing session refresh:

1. Determine `authenticated`:
   - Live env: verified claims via `supabase.auth.getClaims()` (`sub` present).
   - No live env: presence of the local session cookie (`foundly_book_session`).
2. Redirects:
   - `pathname` starts with `/admin` **and** not authenticated → `/login`.
   - `pathname` is `/login` **and** authenticated → `/admin/agenda`.
3. Middleware imports **only** edge-safe modules (`shared/infra/supabase/*`, `shared/infra/authGuard.ts`); it never imports the in-memory store.
4. The refreshed cookies are propagated on the response (existing behaviour).

## Server backstops

- `app/admin/layout.tsx`: `resolveTenantSession()`; if not `ok` → `redirect('/login')`.
- `shared/tenancy/queries.ts` → `getAdminTenantId()`: unauthenticated → `redirect('/login')` (was `/onboarding`).
- `app/login/page.tsx`: if a session exists → `redirect('/admin/agenda')`.
- An authenticated account **without** a business binding is routed to the registration/onboarding entry point (not `/login`).

## Redirect targets

| Situation                                 | Target                            |
| ----------------------------------------- | --------------------------------- |
| No session on `/admin/*`                  | `/login`                          |
| Signed-in on `/login`                     | `/admin/agenda`                   |
| Authenticated but unbound (no `tenantId`) | `/onboarding`                     |
| Session ends mid-panel                    | `/login` on next protected action |

## Rules

- Access decisions use verified/derived data only; never the URL.
- Middleware is a coarse gate (cookie/claims presence); server guards are authoritative.
- Redirects use relative paths so the multi-zone base is preserved.
- No function values cross the server→client boundary in guarded layouts (`code-rules.md` §8).
