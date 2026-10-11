# Phase 0 Research: Production Copy & Branded Assets for the Apps Dataset

**Feature**: `003-real-apps-data` | **Date**: 2026-10-06

All Technical Context unknowns resolved. No `NEEDS CLARIFICATION` remains.

## R1 — Image element: `<img>` vs `astro:assets` `<Image/>`

**Decision**: Render product images with a plain `<img>` element pointing at the fixed public URL
(`app.icon || app.logo`).

**Rationale**: The spec (FR-011) fixes asset locations under `public/<product>/...`. `astro:assets`
`<Image/>` optimizes local assets that are imported from `src/`; it cannot transform arbitrary
files already served from `public/` without relocating them. A plain `<img>` with explicit
`width`/`height` (or a fixed sizing class) preserves the mandated paths while still avoiding layout
shift. The images are small PNGs already shipped in the repo, so the optimization loss is negligible.

**Alternatives considered**:

- Move assets to `src/assets/<product>/` and import them into `<Image/>`: rejected — violates the
  spec's mandated public paths and adds indirection for no measurable performance gain.
- `LoadingImage`/`Picture` with remote URL: rejected — files are local, not remote, and no transform
  source is available.

Documented as a justified deviation in `plan.md` Complexity Tracking and `constitution.md`'s
subordinate `code-rules.md` §6.

## R2 — Missing Mixbit assets

**Decision**: Treat `public/mixbit/branding-logo.png` and `public/mixbit/icon.png` as required
feature inputs; add them before build. Until supplied, the card must degrade gracefully (alt text
remains, layout intact) so a missing file does not break the grid.

**Rationale**: `public/foundly-finance`, `public/foundly-pos` and `public/foundly-maker` already
contain both files, but `public/mixbit/` does not exist. FR-011 mandates the Mixbit paths regardless,
and SC-007 requires 0 references to wrong/missing product folders.

**Alternatives considered**:

- Omit Mixbit from the dataset: rejected — FR-001 requires exactly four products.
- Point Mixbit at another product's folder: rejected — violates FR-011 and SC-007.

## R3 — Controlled image footprint (no layout shift)

**Decision**: Constrain the header image with a fixed height and contained aspect
(e.g. `h-10 w-auto object-contain`, or a fixed `h-12 w-12 object-contain` square) plus explicit
`width`/`height` attributes, so intrinsic image size cannot reflow the card.

**Rationale**: Satisfies FR-013 and the constitution's CLS goal (Principle V). `object-contain`
guarantees logos with differing aspect ratios never overflow or distort.

**Alternatives considered**:

- Auto width with no height constraint: rejected — causes layout "jumps" as images load.
- Fixed square `object-cover`: rejected — would crop non-square logos.

## R4 — Transparency compositing over the card

**Decision**: Give the image container a light, token-aligned surface (`bg-card-light/80` or
`bg-app-body`/`#FAFAFC` equivalent) with rounded corners so transparent PNGs blend into the card
without a hard box or halo.

**Rationale**: Satisfies FR-014. Using existing tokens keeps compliance with Principle VI
(no literal brand hex). The card already renders on `bg-card-light/60` with `backdrop-blur-md`, so a
slightly more opaque inner surface reads cleanly.

**Alternatives considered**:

- No background: rejected — transparent art can ghost the card border/gradient behind it.
- Hard white box: rejected — introduces a visible rectangle over the card.

## R5 — Icon vs logo selection and fallback

**Decision**: Prefer `app.icon`, fall back to `app.logo` (`app.icon || app.logo`).

**Rationale**: The isotipo/icon is the compact, identity-forward mark suited to a card header; the
wordmark is the fallback when no icon exists. Satisfies FR-012 and the "header never empty" edge case.

**Alternatives considered**:

- Prefer the full logo: rejected — wider wordmarks crowd the card header; the icon is more compact.
- Render both: rejected — adds visual noise and is out of scope.

## R6 — Product naming consistency (Foundly Maker vs LRC-Maker)

**Decision**: Canonical product name becomes **"Foundly Maker"** (matching the spec's
"Foundly Maker (LRC-Maker)" and the `/foundly-maker/` asset folder). The prior dataset value
"LRC-Maker" is superseded; any retained reference notes it as formerly "LRC-Maker".

**Rationale**: The production copy and asset paths both use "Foundly Maker"; keeping "LRC-Maker" as
the display name would contradict FR-005 and FR-011. This is a data-value update, not a new entity.

**Alternatives considered**:

- Keep "LRC-Maker" as `name` and only add assets: rejected — misaligns display name with asset
  folder and the user-facing copy.

## R7 — Data contract shape

**Decision**: Extend `Application` with explicit, non-optional fields:
`headline: string`, `subheadline: string`, `keyFeature: string`, plus the existing
`description: string` (serving as "what it solves"), and `logo: string`, `icon: string`.
All four records must provide every field.

**Rationale**: Satisfies FR-006 (explicit contract; a missing field fails `astro check`) and keeps
the "single source of truth" guarantee (FR-007). String types are sufficient; no nested structures
are needed.

**Alternatives considered**:

- Optional fields: rejected — would allow silent empty rendering, weakening SC-001.
- Nested `assets: { logo; icon }`: rejected — flatter fields match the requested shape and existing
  `apps.ts` style, and simplify the card's `app.icon || app.logo`.
