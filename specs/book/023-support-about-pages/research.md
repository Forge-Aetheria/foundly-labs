# Research: Book Support and About Pages

**Feature**: `specs/book/023-support-about-pages/spec.md`
**Date**: 2026-10-25

## R1 — Content source

**Decision**: Static content files inside `apps/book/src/modules/support` and `.../about`.

**Rationale**: These pages are informational; no API or CMS is needed.

## R2 — FAQ presentation

**Decision**: Use MUI `Accordion` for accessible expand/collapse.

**Rationale**: Native accessibility and keyboard support with minimal custom code.

## R3 — External links

**Decision**: Use standard anchors/`Link` with `target="_blank"` and `rel="noopener noreferrer"` for https, and `mailto:` for email.

**Rationale**: No platform bridge needed on web; safe external navigation.

## R4 — Version

**Decision**: Define a Book panel version constant with fallback, shown in About.

**Rationale**: Client page cannot reliably read package metadata at runtime without extra config.

## R5 — Reuse

**Decision**: Use `@foundly/ui` primitives (`Card`, `Stack`, `Typography`, `Button`) and existing icon/theme conventions.

**Rationale**: Constitution §5.VII and Clean Light UI consistency.
