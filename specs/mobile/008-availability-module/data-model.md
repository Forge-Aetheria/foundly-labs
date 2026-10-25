# Data Model: Mobile Availability Module

**Feature**: `specs/mobile/008-availability-module/spec.md`
**Date**: 2026-10-25

No persistent schema changes. Uses the existing `Availability` and `TimeBlock` models.

## AvailabilityRule (view model)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `string` | Rule id. |
| `weekday` | `number` | 0 = Sunday … 6 = Saturday. |
| `startTime` | `string` | `HH:mm`. |
| `endTime` | `string` | `HH:mm`. |
| `slotGranularityMinutes` | `number` | Default 30. |
| `minLeadTimeMinutes` | `number` | Default 0. |
| `bookingHorizonDays` | `number` | Default 60. |
| `breaks` | `string \| null` | Read-only in this version. |

## DayDraft

| Field | Type | Validation |
| ----- | ---- | ---------- |
| `weekday` | `number` | 0–6. |
| `isOpen` | `boolean` | Default false. |
| `startTime` | `string` | `HH:mm`; required when open. |
| `endTime` | `string` | `HH:mm`; must be > start when open. |

## TimeBlock

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `string` | Block id. |
| `startAt` | `string` | ISO-like `${date}T${time}:00`. |
| `endAt` | `string` | ISO-like `${date}T${time}:00`. |
| `reason` | `string \| null` | Optional. |
| `specialistId` | `string \| null` | Null for tenant-level blocks. |

## TimeBlockDraft

| Field | Type | Validation |
| ----- | ---- | ---------- |
| `mode` | `'range' \| 'fullday'` | Required. |
| `date` | `string` | `YYYY-MM-DD`, required. |
| `startTime` | `string` | Required for range; end > start. |
| `endTime` | `string` | Required for range. |
| `reason` | `string` | Optional. |

## State transitions

- Load: parallel `availability` + `timeBlocks`.
- Weekly save: reconcile draft against existing rules (remove/update/create) → invalidate.
- Add block: draft → `addTimeBlock` → invalidate blocks.
- Delete block: confirmation → `removeTimeBlock` → invalidate blocks.
- Refresh: pull-to-refresh / invalidation with overlay.

## Validation rules

- Open day must have start and end.
- End must be greater than start.
- Time block date required; range end > start.
- Full-day block maps to `00:00–23:59`.
- Closed day removes its rule.
