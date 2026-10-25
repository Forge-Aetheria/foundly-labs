# Data Model: Book Support and About Pages

**Feature**: `specs/book/023-support-about-pages/spec.md`
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
| `label` | `string` | Action label. |
| `href` | `string` | `mailto:` or `https:`. |
| `description` | `string` | Short context. |

## ProductInfo

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` | `string` | Foundly Book. |
| `version` | `string` | Panel version, fallback `0.1.0`. |
| `description` | `string` | Product/ecosystem summary. |

## LegalLink

| Field | Type | Notes |
| ----- | ---- | ----- |
| `label` | `string` | Visible label. |
| `href` | `string` | Public https URL. |

## Validation rules

- FAQ question/answer non-empty.
- Contact/legal URLs use `mailto:` or `https:`.
- Version never empty.
