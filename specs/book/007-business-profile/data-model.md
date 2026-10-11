# Data Model: Foundly Book — Business Profile

**Feature**: `specs/book/007-business-profile/` | **Date**: 2026-10-10

No new entities are introduced: the feature exposes and updates fields already modeled on **Tenant**,
**PortalPolicy** and **BusinessHours** (all in `apps/book/src/shared/types/tenancy.ts`).

## Editing surface (writes)

### Tenant — identity & contact (`profileSchema`)

| Field       | Type    | Rules                                                                                                    |
| ----------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `name`      | string  | required, trimmed, ≤ 120                                                                                 |
| `category`  | string  | required, trimmed, ≤ 80                                                                                  |
| `slug`      | string  | 3–40 chars `[a-z0-9-]`, normalized (`normalizeSlug`), format + reserved allowed, unique (excluding self) |
| `bio`       | ?string | "About", trimmed, ≤ 1000                                                                                 |
| `address`   | ?string | trimmed, ≤ 200                                                                                           |
| `phone`     | ?string | trimmed, ≤ 40                                                                                            |
| `avatar`    | ?string | logo/isotipo URL, ≤ 500                                                                                  |
| `cover`     | ?string | banner/portada URL, ≤ 500                                                                                |
| `instagram` | ?string | URL, ≤ 300                                                                                               |
| `whatsapp`  | ?string | URL/`wa.me` link or phone, ≤ 300                                                                         |

Optional fields store `null` when empty (public blocks render placeholders).

### PortalPolicy — policies (`updatePolicies`)

Replaces the tenant's `portalPolicies` set with an ordered list of entries:

```ts
{
  (id, tenantId, title, body);
} // title ≤ 120, body ≤ 1000; at least a title per entry
```

### BusinessHours — hours summary (read-only here)

`businessHours` (weekday + `isOpen` + `startTime`/`endTime`) is sourced from the availability
configuration and rendered as a weekly visual summary with the display labels; no writes in this view.

## Public read surface (unchanged resolution)

`getPublicBusiness` already maps: identity/logo/cover → header + sticky card; bio → "Acerca de";
address/phone/hours → "Dirección y horarios"; social → sticky card/footer; `portalPolicies` →
policies card. After any save in this feature the public render reflects the change (same seam).

## Relationships

`Tenant` owns `portalPolicies` (0..n) and `businessHours` (7 days). The profile editor mutates the
tenant profile + its policies; availability keeps owning the hours the summary shows.
