# Data Model: Mobile Team Module

**Feature**: `specs/mobile/004-team-module/spec.md`
**Date**: 2026-10-25

No persistent schema changes. Uses the existing `Specialist` and `SpecialistService` models.

## TeamMember (view model)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `string` | Specialist id. |
| `tenantId` | `string` | Tenant scope. |
| `name` | `string` | Required. |
| `role` | `string \| null` | Specialty/role. |
| `avatar` | `string \| null` | Public storage URL. |
| `bio` | `string \| null` | Optional. |
| `active` | `boolean` | Drives availability. |
| `services` | `{ id, name }[]` | Assigned services. |

## TeamDraft (form)

| Field | Type | Validation |
| ----- | ---- | ---------- |
| `name` | `string` | Required, trimmed. |
| `role` | `string` | Optional. |
| `bio` | `string` | Optional, max 500. |
| `avatar` | `string` | Optional URL. |
| `active` | `boolean` | Default true. |
| `serviceIds` | `string[]` | Selected service ids. |

## State transitions

- Load: `specialists(tenantId)` → list with services.
- Create: draft → `createMySpecialist` → sync selected services → invalidate team query.
- Edit: draft from member → `updateMySpecialist` → diff services → assign/unassign → invalidate.
- Toggle: `updateMySpecialist({ active })` → invalidate.
- Delete: confirmation → `deleteMySpecialist` → invalidate.
- Refresh: pull-to-refresh / invalidation with overlay.

## Validation rules

- Name cannot be empty.
- Bio length ≤ 500.
- Service ids must belong to the tenant catalog.
- Avatar uploads must be images ≤ 5 MB.
