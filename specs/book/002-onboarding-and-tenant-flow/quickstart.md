# Quickstart & Validation Guide: Foundly Book — Business Onboarding & Tenant Flow

**Feature**: `002-onboarding-and-tenant-flow` | **Date**: 2026-10-08

How to run and validate the four surfaces end-to-end once implemented. References the design contracts instead of duplicating them.

## Prerequisites

- Node.js ≥ 20 and npm (workspace root installed with `npm install`)
- Repository root: `foundly-labs`
- `apps/book` runs locally on its own port; the `/book` public prefix only exists in the Vercel multi-zone, so locally you use the internal paths (`/`, `/onboarding`, `/admin/*`, `/<slug>`).

## Setup

```bash
npm install
```

Expected: workspace dependencies install with no errors, including `@foundly/ui`.

## Data preparation

The module runs on the **in-memory store seam** extended with `tenants`, `users` and `sessions` (`apps/book/src/shared/infra/store.ts`). There is no database to create or migrate — the persistence strategy is still undefined.

## Run locally

```bash
npm run dev -w @foundly/book
```

Expected: the product page (`/`), the wizard (`/onboarding`), the dashboard (`/admin/*`) and the public portal (`/<slug>`) render. Static routes take precedence over the dynamic slug segment.

## Validate

### 1. Tenancy logic (SC-003, FR-008/FR-014)

```bash
npm run test -w @foundly/book -- tenancy
```

Expected: slug normalize/validate/reserved/unique rules from `contracts/tenancy.contract.md` pass, including invalid formats and reserved words.

### 2. Onboarding contract (FR-007…FR-014, SC-005/SC-006)

```bash
npm run test -w @foundly/book -- onboarding
```

Expected: the three step schemas reject invalid values; `createBusiness` provisions a tenant, owner user and defaults exactly once; idempotent retries do not create duplicates; the local draft survives reload.

### 3. Routes & access (FR-004/FR-016/FR-017, SC-008)

```bash
npm run test -w @foundly/book -- routes
```

Expected: `/admin/*` without a session redirects; unknown/suspended slugs render the unavailable state; cross-tenant reads are denied.

### 4. Portal availability (FR-018)

```bash
npm run test -w @foundly/book -- public-booking
```

Expected: the portal offers only slots from the reused availability engine (001 §R3) and creates appointments with `origin: 'online'`.

### 5. UI consistency and accessibility (SC-007)

```bash
npm run lint && npm run test -w @foundly/book
```

Expected: all four surfaces compose `@foundly/ui`; every flow is keyboard-operable; automated a11y checks report zero critical violations.

### 6. Reserved slugs & routing sanity check (FR-006, contracts/routes.contract.md)

```bash
npm run test -w @foundly/book -- tenancy
```

Expected: reserved slugs (`admin`, `onboarding`, `api`, `www`, `app`, `public`, `static`, `assets`) and invalid formats are rejected at registration and never render a business portal; static segments (`/`, `/onboarding`, `/admin/*`) take precedence over the dynamic `[tenantSlug]` segment, and `/admin/*` redirects unauthenticated requests to `/onboarding`.

## Manual acceptance scenarios

1. Open `/` and confirm the product page explains the module and its call to action leads to `/onboarding`.
2. Complete the wizard: step 1 (account), step 2 (business name + slug + category, with live slug feedback), step 3 (default duration + business hours).
3. Try a reserved slug (`admin`) and a taken slug and confirm rejection with a suggestion.
4. Reload mid-wizard and confirm the draft is restored.
5. After creation, confirm you land on `/admin/agenda` and that the agenda/services/availability screens reflect the configured defaults.
6. Confirm other businesses' data is never visible and `/admin/*` without a session redirects.
7. Open `/<slug>` of the new business, book a free slot as a guest, and confirm the appointment appears in the dashboard with an "online" origin.
8. Open `/<unknown-or-suspended>` and confirm the "not available" state with no data exposed.

## End-to-end acceptance

1. `npm run test -w @foundly/book` → all green.
2. `npm run lint` → clean.
3. `npm run build -w @foundly/book` → builds with zero errors.
4. The manual scenarios above all pass.

This proves SC-001–SC-008 end to end.
