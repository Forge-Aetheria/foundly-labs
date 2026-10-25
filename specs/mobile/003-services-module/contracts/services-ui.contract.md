# UI Contract: Services Module

**Feature**: `specs/mobile/003-services-module`

## Module surface

```ts
export function useServices(): UseQueryResult<Service[], ServicesError>;
export function useCreateService(): UseMutationResult<Service, ServicesError, CreateMyServiceInput>;
export function useUpdateService(): UseMutationResult<
  Service,
  ServicesError,
  { id: string; input: UpdateMyServiceInput }
>;
export function useDeleteService(): UseMutationResult<true, ServicesError, string>;
```

## Screen contract

- `app/(drawer)/servicios.tsx` renders `ServicesView` only.
- `ServicesView` provides:
  - Title “Servicios”.
  - Search field filtering by name.
  - Add button opening the create modal.
  - Loading state while the query is initial.
  - Empty state when there are no services.
  - Error state with retry.
  - Pull-to-refresh and overlay during refetch.
  - Cards with name, category, description, duration, price, advance and status.
  - Edit and delete actions.
- Delete requires `Alert` confirmation.

## Form contract

- `ServiceFormModal` receives `{ visible, service, onClose }`.
- Fields: name, category, duration, price, description, active, requiresAdvance, advanceKind, advanceValue.
- Validation errors are shown inline; API errors are shown as an alert message.
- Save button shows loading while create/update is pending.
- The modal is remounted per service id to guarantee draft initialization.

## Data mapping guarantees

- UI never calls `apiRequest` or `useQuery` directly.
- Price and fixed advance are converted to cents at submit.
- Percent advance is sent as an integer percentage.
- Optional empty strings become `null`.
