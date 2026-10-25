# Quickstart Validation: Book Support and About Pages

**Feature**: `specs/book/023-support-about-pages/spec.md`
**Date**: 2026-10-25

## Automated verification

```bash
pnpm --filter @foundly/book typecheck
pnpm --filter @foundly/book lint
pnpm --filter @foundly/book test
pnpm --filter @foundly/book build
```

## Manual validation

1. Open `/admin/soporte`; confirm the placeholder is gone.
2. Confirm intro, FAQ and contact channels.
3. Expand/collapse FAQ items.
4. Open the email and website links.
5. Open `/admin/acerca`; confirm logo, version, description and links.
6. Open site/privacy/terms links.
7. Resize to mobile width and confirm both pages remain readable.
8. Navigate between admin modules and confirm the layout/session persist.
