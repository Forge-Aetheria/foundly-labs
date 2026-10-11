# Contract: Application Data (`src/shared/data/apps.ts`)

**Feature**: `002-branding-apps-grid` | **Type**: Data contract

## Shape

```ts
export interface Application {
  id: string;
  name: string;
  category: string;
  status: string;
  target: string;
  description: string;
}

export const apps: Application[];
```

## Obligations

- `apps` MUST contain exactly four records, in order: Foundly (Mobile Finance), Foundly POS,
  LRC-Maker, and Mixbit, with the values in [data-model.md](../data-model.md).
- Every field MUST be a non-empty string; `id` MUST be unique.
- The list MUST be exported as a typed `Application[]`; no `any`.

## Verification

- `astro check` resolves the `Application` type with no errors.
- `AppsGrid` renders 1 card per record (4 total) with the exact field values.
