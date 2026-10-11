# Implementation Plan: Foundly Book — Business Profile

**Branch**: `007-business-profile` | **Date**: 2026-10-10 | **Spec**: `specs/book/007-business-profile/spec.md`

**Input**: Feature specification from `/specs/book/007-business-profile/spec.md`

## Summary

Turn `/admin/profile` into the single editor for the business storefront identity: name, category,
public URL (slug), logo/cover (URLs with preview), phone/WhatsApp, Instagram, physical address,
"About" description, reservation/cancellation policies and a visual weekly-hours summary sourced
from the availability configuration. Every save persists through the same store seam read by
`getPublicBusiness`, so the public header, sticky card, "Acerca de", "Dirección y horarios" and
footer on `/book/[tenantSlug]` update immediately. Reuses the existing storefront feature module and
the pure slug rules already in the domain.

## Technical Context

**Language/Version**: TypeScript 5.9 · React 19 · Next.js 15.5 (App Router)

**Primary Dependencies**: `@foundly/ui` (design system) · MUI v6 (engine) · Zod 4

**Storage**: None — in-memory seam `apps/book/src/server/store.ts`

**Testing**: Vitest + RTL + vitest-axe (`npm run test -w @foundly/book`, `-w @foundly/ui`)

**Target Platform**: Web (Next.js server components + client islands)

**Project Type**: Web application (monorepo workspace)

**Performance Goals**: N/A

**Constraints**: C1 — views use `@foundly/ui` only; C2 — `apps/book/src/domain` stays framework-free; C3 — persistence only via the store seam.

**Scale/Scope**: one admin profile editor + model validation; no new entities required (Tenant,
PortalPolicy and BusinessHours already exist).

## Constitution Check

*GATE: must pass before Phase 0 research. Re-check after Phase 1 design.*

- Specs live under `/specs/<dominio>/<nnn>-<feature>/` → **OK** (`book/007-business-profile`).
- Views consume `@foundly/ui` + tokens → **OK** (glass cards/pills via `GLASS_CARD_SX`, `primary.main`).
- Domain logic pure → **OK** (slug validation reuses `domain/tenancy/slug.ts`; hours summary is read-only data binding).
- Persistence not defined → **OK** (mutations through the store seam; images and links URL-based).

*Re-check after Phase 1 design:* **PASS** — no new entities or `@foundly/ui` primitives; slug rules
reused from the domain; the hours summary is a read-only projection of `businessHours`; both new
mutations remain behind the store seam.

## Project Structure

### Documentation (this feature)

```text
specs/book/007-business-profile/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── admin-profile.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/features/storefront/schemas.ts
├── EXTEND profileSchema with slug (format/uniqueness)
└── ADD policiesSchema (title/body entries), policySchema
apps/book/src/features/storefront/actions.ts
├── EXTEND updateProfile (slug validate + unique, resolve conflicts)
└── ADD updatePolicies (replace tenant portalPolicies)
apps/book/src/features/storefront/queries.ts
└── ADD listPolicies(tenantId)
apps/book/src/features/storefront/components/ProfileEditor.tsx   # REWRITE: identity+slug, previews, contact, about, policies editor, hours summary
apps/book/src/app/admin/profile/page.tsx                         # pass policies + hours to the editor
specs/book/007-business-profile/                                 # feature docs (this feature)

# Read-only references (no change expected):
apps/book/src/domain/tenancy/slug.ts        # validateSlug/normalizeSlug (existing)
apps/book/src/domain/tenancy/types.ts       # Tenant/PortalPolicy/BusinessHours (existing)
apps/book/src/features/public-booking/queries.ts  # getPublicBusiness already exposes identity/contact/policies/hours
```

**Structure Decision**: Feature docs in the domain spec folder; implementation stays inside the
existing `storefront` feature module; no new app/package or `@foundly/ui` primitive needed
(`TextField` already supports `multiline`/`maxLength`, `Modal`/`Badge`/`Stack` cover the rest).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Two mutations for one form (`updateProfile` + `updatePolicies`) | The policies are a separate collection (`portalPolicies`) from the tenant profile; editing both in one form is simpler for the operator | Merging policies into the tenant object would leak a concern the store already models separately |
| New exposed field only via existing entity (slug) | The service must keep register (`slug`) while allowing format/uniqueness validation | Reusing onboarding's `validateSlug` avoids a second rule source; changing slug is intentionally restricted to valid/unique values |