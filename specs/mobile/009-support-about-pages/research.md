# Research: Mobile Support and About Pages

**Feature**: `specs/mobile/009-support-about-pages/spec.md`
**Date**: 2026-10-25

## R1 — Data source

**Decision**: Static content modules inside the mobile app.

**Rationale**: The spec explicitly scopes these as informational pages. No API, storage or codegen is needed.

**Alternatives considered**: CMS/API-driven content — rejected as unnecessary complexity for this iteration.

## R2 — Support contact channel

**Decision**: Use a configurable contact email and the public Foundly site as channels; validate `mailto:`/`https:` before opening.

**Rationale**: Provides a clear contact path without inventing an unsupported ticketing integration.

## R3 — FAQ presentation

**Decision**: Expandable/collapsible FAQ rows in a ScrollView.

**Rationale**: Keeps the page compact and mobile-friendly; answers are readable without leaving the screen.

## R4 — About content

**Decision**: Show Foundly branding, app version from `expo-constants`, a product/ecosystem description and links to the public site, privacy and terms.

**Rationale**: Reuses the existing public resources and avoids duplicating legal text inside the app.

## R5 — Link error handling

**Decision**: Centralize external link opening in a small helper that validates the URL and returns a user-friendly error.

**Rationale**: Prevents crashes on unsupported URLs and gives consistent feedback across both pages.

## R6 — Reuse

**Decision**: Reuse `Screen`, `AppText`, `Button`, `@expo/vector-icons` and design tokens; no new design primitives.

**Rationale**: Follows constitution principle 5.VII.
