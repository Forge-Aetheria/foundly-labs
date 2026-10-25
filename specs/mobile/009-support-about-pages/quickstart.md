# Quickstart Validation: Mobile Support and About Pages

**Feature**: `specs/mobile/009-support-about-pages/spec.md`
**Date**: 2026-10-25

## Prerequisites

- Authenticated tenant session.
- Device/simulator with a browser and mail client for external links.

## Automated verification

```bash
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
pnpm --filter @foundly/mobile build
```

Expected: all pass; content/link tests cover non-empty FAQ, allowed URL schemes and version fallback.

## Manual validation

1. Open **Ayuda y Soporte**; confirm the placeholder is gone.
2. Confirm the intro and FAQ list.
3. Expand/collapse a FAQ answer.
4. Press the contact channel; confirm the mail client/browser opens.
5. Open **Acerca de Foundly**; confirm the placeholder is gone.
6. Confirm Foundly branding, version, description and legal links.
7. Press each legal/institutional link; confirm it opens externally.
8. Force an invalid link (if testable) and confirm the inline error without a crash.
9. Scroll both pages on a small screen and confirm readability.
10. Navigate away and back through the drawer; confirm the session remains active.
