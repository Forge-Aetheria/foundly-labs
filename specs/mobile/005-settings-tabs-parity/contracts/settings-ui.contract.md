# UI Contract: Settings Tabs

**Feature**: `specs/mobile/005-settings-tabs-parity`

## Screen contract

- `SettingsView` loads `useMyBusiness` and provides three tabs: `perfil`, `pagos`, `seguridad`.
- Initial/loading state uses `LoadingState` screen variant.
- Query error uses `ErrorState` with retry.
- Refetch uses `LoadingState` overlay.
- The screen must render no empty content while loading.

## Profile tab

- Fields: name, category chips, tags (comma-separated), slug, public switch, logo.
- Logo supports upload via `pickAndUploadTenantImage(tenantId, 'logo')` and manual URL.
- Save validates name, category and slug.
- Save button is fixed in a safe-area-aware footer and shows pending state.
- Save calls `useUpdateBusinessProfile` and shows success/error feedback.

## Payments tab

- Uses `usePaymentMethods`.
- Lists cards with title/type, details summary, status, edit/toggle/delete.
- Modal configures type, dynamic detail fields, title, instructions and active.
- Delete requires `Alert` confirmation.
- Pending mutations show loading and disable actions.

## Security tab

- Fields: current, new and confirm password.
- Uses `useChangePassword` from the auth module.
- Validates length, letters/numbers and matching confirmation.
- Shows success or mapped error message; button shows pending state.

## Reuse guarantees

- `ConfigurationTabs`, `Button`, `TextField`, `LoadingState`, `ErrorState`, `SessionAvatar` and shared media helper are reused.
- No direct `useQuery`/`useMutation`/`apiRequest` calls in presentational components.
