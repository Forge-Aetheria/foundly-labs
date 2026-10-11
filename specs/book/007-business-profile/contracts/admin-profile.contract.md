# Contract: Admin Profile Editor (Perfil y Acerca de)

**Feature**: `specs/book/007-business-profile/` | **Date**: 2026-10-10

Documents the `/admin/profile` surface after 007-business-profile. All primitives come from
`@foundly/ui` and colors from theme tokens (glass cards via `GLASS_CARD_SX`, pill `primary.main`).
Saves write to the same store seam read by `getPublicBusiness`, so the public header, sticky card,
"Acerca de", "Dirección y horarios" and footer on `/book/<slug>` update immediately (FR-006).

## Sections

| Section                 | Fields & behavior                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identidad**           | `Nombre del negocio` (required) · `Categoría / Rubro` (required) · `URL pública` (slug, pre-filled, live-format hint). If the slug is invalid or taken, saving is blocked with an inline error. |
| **Logo y portada**      | `Logo (URL)` y `Portada (URL)` each with a live `<img>` preview; empty values clear them.                                                                                                       |
| **Contacto y redes**    | `Teléfono` · `Instagram` · `WhatsApp` · `Dirección` (optional; empty persists as null and public blocks show placeholders).                                                                     |
| **Acerca de**           | `Bio / descripción` multiline (≤ 1000) with character counter.                                                                                                                                  |
| **Políticas**           | Ordered editor list of `{ título, descripción }` entries (add one per row, remove per entry); empty list is allowed.                                                                            |
| **Horario de atención** | Visual weekly summary (Mon–Sun with open hours or "Cerrado") derived from the availability configuration; read-only here.                                                                       |

## Actions

| Action                | Input summary                             | Better                                                                                |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `Guardar perfil`      | identity + contact + about (+ logo/cover) | Persists via `updateProfile`; success → `Badge` "Guardado"; errors inline (`fields`). |
| `Guardar` (políticas) | policies list                             | Persists via `updatePolicies` and keeps the local list.                               |

`updateProfile` validates slug format/uniqueness (excluding self) and returns `ActionResult`;
`updatePolicies` replaces the tenant's `portalPolicies`. Both authorize the admin session.

## Read surface

- Page `/admin/profile` passes `profile` (from `getTenantProfile`), `policies` (from `listPolicies`)
  and the `businessHours` summary to the editor.

## Guarantees

- Uses `@foundly/ui` only; raw `<img>` previews use the MUI `Box` primitive (same convention as `ProviderSections`).
- `vitest-axe` clean; all controls keyboard-operable.
- Component + action tests assert slug validation (invalid/taken), preview rendering, policy add/remove,
  hours summary rendering and public reflection of every saved section.
