# Research: Foundly Book — Business Profile

**Feature**: `specs/book/007-business-profile/` | **Date**: 2026-10-10

## Prior art in the codebase

- `apps/book/src/features/storefront/components/ProfileEditor.tsx` + `updateProfile` already persist
  identity (name, category), about (bio), contact (address, phone, instagram, whatsapp) and
  logo/cover URLs to `Tenant`, and `getPublicBusiness` already surfaces them to the public header,
  sticky card, "Acerca de" and "Dirección y horarios".
- The gap: the editor does NOT expose the public URL (slug), the reservation/cancellation policies or a
  visual hours summary. Slug validation already exists in `domain/tenancy/slug.ts` (`validateSlug`/
  `normalizeSlug`, format + reserved + uniqueness); `portalPolicies` (a separate store collection)
  and `businessHours` already feed the public page.
- No new `@foundly/ui` primitive is required; `TextField` (multiline/maxLength) covers textareas.

## Decisions

1. **Slug editing**: expose the tenant `slug` in the editor; on save validate with `validateSlug`
   (format/reserved) and reject duplicates excluding the tenant itself. Normalize via
   `normalizeSlug` before persisting. Changing the slug moves the public URL (`/book/<slug>`).
2. **Policies editor**: manage a list of `{ title, body }` entries in the form (single-field add,
   per-entry remove). Saved through a separate `updatePolicies` action that replaces the tenant's
   `portalPolicies`, keeping the collection/model boundary clean.
3. **Hours summary**: read-only weekly list built from `Tenant.businessHours` + `WEEKDAY_LABELS`;
   editing remains in `/admin/availability` (spec FR-005). The summary refreshes on any next render.
4. **Previews**: logo/cover URL fields render a live `<img>` preview (same pattern as the 005 avatar
   preview) before saving.
5. **Sync**: identity/contact/about save through `updateProfile` (single mutation); policies through
   `updatePolicies`; the component updates local state from results and the seam reflects changes
   server-side on the public render (mock seam; real persistence deferred).
6. **Empty optional values**: phone/instagram/address/policies store `null`/empty and the public
   blocks render placeholders (existing behavior), satisfying FR-007.

## Risks

- Changing the slug affects the public route; the editor keeps the current slug pre-filled and
  validates before persisting (no auto-rename of links in this version — documented in assumption).
- `updateProfile` already clears unknown optional fields to `null`; the policies flow uses a separate
  collection so the two actions stay independent and testable.