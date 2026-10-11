# Contract: Application Data (`src/shared/data/apps.ts` + `src/shared/types/index.ts`)

**Feature**: `003-real-apps-data` | **Type**: Data contract

## Shape

```ts
export interface Application {
  id: string;
  name: string;
  category: string;
  status: string;
  target: string;
  headline: string;
  subheadline: string;
  description: string; // "what it solves"
  keyFeature: string;
  logo: string; // public URL, e.g. "/foundly-finance/branding-logo.png"
  icon: string; // public URL, e.g. "/foundly-finance/icon.png"
}

export const apps: Application[];
```

## Obligations

- `apps` MUST contain exactly four records, in order: Foundly (Finance), Foundly POS,
  Foundly Maker, Mixbit.
- Every field MUST be present and a non-empty string; the type MUST be non-optional so a missing
  field fails type checking (FR-006).
- `id` MUST be unique.
- `headline`, `subheadline`, `description` and `keyFeature` MUST match the production values in
  [spec.md](../spec.md) FR-002–FR-005 verbatim.
- `logo` and `icon` MUST equal the exact paths in FR-011:
  - Foundly: `/foundly-finance/branding-logo.png`, `/foundly-finance/icon.png`
  - Foundly POS: `/foundly-pos/branding-logo.png`, `/foundly-pos/icon.png`
  - Foundly Maker: `/foundly-maker/branding-logo.png`, `/foundly-maker/icon.png`
  - Mixbit: `/mixbit/branding-logo.png`, `/mixbit/icon.png`
- No `any`, no implicit casts.

## Verification

- `astro check` resolves `Application` with no errors.
- The ecosystem grid renders 1 card per record (4 total) with the exact field values and images.
- Built `dist/index.html` references all four product asset paths (FR-016, SC-007).
