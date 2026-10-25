# Data Model: Mobile Support and About Pages

**Feature**: `specs/mobile/009-support-about-pages/spec.md`
**Date**: 2026-10-25

No persistence. Static content shapes only.

## FaqItem

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `string` | Stable key. |
| `question` | `string` | Required. |
| `answer` | `string` | Required. |

## ContactChannel

| Field | Type | Notes |
| ----- | ---- | ----- |
| `label` | `string` | Visible action label. |
| `url` | `string` | `mailto:` or `https:` URL. |
| `icon` | Ionicons name | Visual cue. |

## ProductInfo

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` | `string` | Foundly. |
| `tagline` | `string` | Short positioning line. |
| `description` | `string` | Product/ecosystem summary. |
| `version` | `string` | From `expo-constants`, fallback `0.1.0`. |

## LegalLink

| Field | Type | Notes |
| ----- | ---- | ----- |
| `label` | `string` | Visible label. |
| `url` | `string` | Public `https:` URL. |
| `icon` | Ionicons name | Visual cue. |

## State transitions

- Support: FAQ rows toggle open/closed locally.
- External link press: validate URL → `Linking.openURL` → success or inline error.
- About: static render; no state beyond link errors.
- No loading, empty or error states tied to data queries.

## Validation rules

- FAQ items must have non-empty question and answer.
- Contact and legal URLs must be `mailto:` or `https:`.
- Version must never render empty; fallback to `0.1.0`.
