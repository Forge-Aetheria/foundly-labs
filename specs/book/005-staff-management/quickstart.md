# Quickstart: Foundly Book — Staff Management

**Feature**: `specs/book/005-staff-management/` | **Date**: 2026-10-10

## Onboarding

1. `npm install` at the repository root (workspace wiring).
2. Run the book tests: `npm run test -w @foundly/book` (expect 100%).
3. Run the build gate: `npm run build -w @foundly/book`.

## Manual walkthrough

1. Start `npm run dev -w @foundly/book` (port 3001) and open `http://localhost:3001/admin/staff`.
2. Header shows **"Equipo y Especialistas"** and a pill **"+ Añadir Profesional"**.
3. The roster renders as glassmorphism cards with avatar/initials, name + role, service badges,
   status badge and per-card actions.
4. Click "+ Añadir Profesional": fill **Nombre** and **Cargo** (required), add a bio (≤250), a photo
   URL (with preview), tick services and flip the **Activo** switch; clicking **Guardar profesional**
   adds the card.
   - Empty name or role blocks the save with inline errors.
   - No service ticked shows a warning but does not block.
   - Entering an avatar URL shows a live preview in the modal.
5. Verify the public side: open `http://localhost:3001/estudio-ana` — the new specialist (with its
   service badges) appears; toggling a member Inactivo or removing it drops it from the public team.

## Test commands

| Command                              | Scope                                        |
| ------------------------------------ | -------------------------------------------- |
| `npm run test -w @foundly/book`      | Vitest + RTL + vitest-axe (book app)         |
| `npm run test -w @foundly/ui`        | Shared UI primitives (Switch/Checkbox)       |
| `npm run build -w @foundly/book`     | Production build + type check                |