# Data Model: Mobile Services Module

**Feature**: `specs/mobile/003-services-module/spec.md`
**Date**: 2026-10-25

No persistent schema changes. The module uses the existing `Service` model and GraphQL types.

## Service (view model)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `string` | Service id. |
| `name` | `string` | Required. |
| `description` | `string \| null` | Optional. |
| `category` | `string \| null` | Optional. |
| `durationMinutes` | `number` | Positive integer. |
| `priceCents` | `number` | Integer, ≥ 0. |
| `active` | `boolean` | Shown as Activo/Inactivo. |
| `requiresAdvance` | `boolean` | Enables advance rule. |
| `advanceKind` | `'fixed' \| 'percent' \| null` | API enum. |
| `advanceValue` | `number \| null` | Cents when fixed, percent when percent. |

## ServiceDraft (form)

| Field | Type | Validation |
| ----- | ---- | ---------- |
| `name` | `string` | Required, trimmed. |
| `description` | `string` | Optional. |
| `category` | `string` | Optional. |
| `duration` | `string` | Numeric, > 0. |
| `price` | `string` | Numeric, ≥ 0; converted to cents. |
| `active` | `boolean` | Default true. |
| `requiresAdvance` | `boolean` | Default false. |
| `advanceKind` | `'fixed' \| 'percent' \| ''` | Required when advance enabled. |
| `advanceValue` | `string` | > 0; ≤ 100 for percent. |

## State transitions

- Create: draft → `createMyService` → invalidate list → list shows new service.
- Edit: draft loaded from service → `updateMyService` → invalidate list.
- Delete: confirmation → `deleteMyService` → invalidate list.
- Refresh: pull-to-refresh or invalidation → overlay while fetching, previous data retained.
- Error: list error with retry; mutation error shown without losing the form.

## Mapping rules

- `priceCents` ↔ `price` (euros).
- Fixed `advanceValue` ↔ euros; percent stays as integer.
- Empty optional strings map to `null`.
- Active defaults to `true` on create.
