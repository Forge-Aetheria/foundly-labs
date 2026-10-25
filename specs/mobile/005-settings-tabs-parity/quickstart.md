# Quickstart Validation: Mobile Settings Tabs Parity

**Feature**: `specs/mobile/005-settings-tabs-parity/spec.md`
**Date**: 2026-10-25

## Prerequisites

- Authenticated tenant session.
- API reachable.
- Existing payment methods for edit/delete tests.

## Automated verification

```bash
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
pnpm --filter @foundly/mobile build
```

## Manual validation

1. Open **Configuración** and confirm the three tabs.
2. Edit business name, category, tags and slug; save and reopen to confirm persistence.
3. Toggle the public page and confirm the state.
4. Upload a logo and confirm the preview; save and reopen.
5. Open **Pagos**, create a method with dynamic details, edit it, toggle it and delete it with confirmation.
6. Confirm loading overlays during refetch and button spinners during mutations.
7. Open **Seguridad**, attempt a wrong current password and confirm the error.
8. Change the password successfully and confirm the success message.
9. Open the keyboard in each tab and confirm inputs/footers remain reachable.
