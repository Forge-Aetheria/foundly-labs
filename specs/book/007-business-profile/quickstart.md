# Quickstart: Foundly Book — Business Profile

**Feature**: `specs/book/007-business-profile/` | **Date**: 2026-10-10

## Onboarding

1. `npm install` at the repository root (workspace wiring).
2. Run the suites: `npm run test -w @foundly/book` and `npm run test -w @foundly/ui` (expect 100%).
3. Run the build gate: `npm run build -w @foundly/book`.

## Manual walkthrough

1. Start `npm run dev -w @foundly/book` (port 3001) and open `http://localhost:3001/admin/profile`.
2. **Identidad**: name, category and public URL are pre-filled. Change the name and watch the logo
   preview render when you paste a logo URL. Try an invalid slug (`Mi Estudio!`) or a taken one
   (`admin`) → save is blocked with an inline error; a valid slug saves.
3. **Contacto y redes / Acerca de**: update phone/Instagram/WhatsApp, address and the About text
   (multiline), then **Guardar perfil** → the `Badge` "Guardado" appears.
4. **Políticas**: add a policy title/body row, then save → row persists.
5. **Horario**: the weekly summary shows Mon–Sat 09:00–18:00 (Cerrado on Sunday), sourced from the
   availability config; change hours in `/admin/availability` and the summary follows.
6. Verify the public side: open `http://localhost:3001/estudio-ana` — the header, sticky card,
   "Acerca de", "Dirección y horarios" and the policies card reflect the saved values immediately.

## Validation matrix (contract `contracts/admin-profile.contract.md`)

| Scenario                    | Expected                                                            |
| --------------------------- | ------------------------------------------------------------------- |
| Save valid profile          | Badge "Guardado"; public header/sticky/About/Dirección reflect it    |
| Invalid or taken slug       | Inline `VALIDATION_ERROR`; nothing changed                           |
| Empty optional contact      | Persists as null; public blocks show placeholders                    |
| Logo/portada URL            | Live preview shown before saving                                     |
| Add/remove policies         | List updates locally and persists via `updatePolicies`               |
| Hours summary               | Matches the availability configuration                               |

## Test commands

| Command                              | Scope                          |
| ------------------------------------ | ------------------------------ |
| `npm run test -w @foundly/book`      | Vitest + RTL + vitest-axe      |
| `npm run test -w @foundly/ui`        | Shared UI primitives suite     |
| `npm run build -w @foundly/book`     | Production build + type check  |