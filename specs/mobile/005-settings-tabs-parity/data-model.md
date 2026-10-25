# Data Model: Mobile Settings Tabs Parity

**Feature**: `specs/mobile/005-settings-tabs-parity/spec.md`
**Date**: 2026-10-25

No persistent schema changes.

## BusinessProfile (existing)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` | `string` | Business name. |
| `category` | `string` | Tenant category. |
| `tags` | `string[]` | Display tags. |
| `isPublic` | `boolean` | Public page visibility. |
| `profile.slug` | `string` | Public URL slug. |
| `profile.logo` | `string \| null` | 1:1 image URL. |

## PaymentMethod (existing)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `string` | Method id. |
| `type` | `PaymentMethodType` | pago_movil, binance, zelle, transfer, cash. |
| `title` | `string \| null` | Optional label. |
| `details` | `string \| null` | Serialized structured details. |
| `instructions` | `string \| null` | Optional instructions. |
| `active` | `boolean` | Enabled for booking. |

### Payment details keys

`holder`, `cedula`, `phone`, `bank`, `payId`, `email`, `account`.

## PasswordChange

| Field | Validation |
| ----- | ---------- |
| `currentPassword` | Required; verified via reauthentication. |
| `newPassword` | ≥ 8 chars, letters + numbers. |
| `confirmPassword` | Must match `newPassword`. |

## State transitions

- Tab switch: local state, panels keep their own forms.
- Profile save: update mutation → invalidate business query → overlay during refetch.
- Payment save/toggle/delete: mutation → invalidate payment query → list refresh.
- Password save: reauth → update → success message or mapped error.
