# UI Contract: Availability Module

**Feature**: `specs/mobile/008-availability-module`

## Module surface

```ts
export function useAvailability(): UseQueryResult<AvailabilityRule[], AvailabilityError>;
export function useTimeBlocks(): UseQueryResult<TimeBlock[], AvailabilityError>;
export function useSaveAvailability(): UseMutationResult<true, AvailabilityError, DayDraft[]>;
export function useAddTimeBlock(): UseMutationResult<TimeBlock, AvailabilityError, TimeBlockInput>;
export function useRemoveTimeBlock(): UseMutationResult<true, AvailabilityError, string>;
```

## Screen contract

- `app/(drawer)/disponibilidad.tsx` renders `AvailabilityView` only.
- `AvailabilityView` provides:
  - Title “Disponibilidad”.
  - Initial loading while rules and blocks load.
  - Error state with retry if either query fails.
  - Pull-to-refresh and refresh overlay.
  - Weekly schedule card and time-block section.
- Weekly schedule:
  - Seven days rendered Monday-first but using weekday indices.
  - Open/closed switch per day.
  - Start/end time fields for open days.
  - Save button with pending state and success/error feedback.
  - End must be after start.
- Time blocks:
  - List with date, time range or full-day indicator, reason and delete action.
  - Empty state when no blocks.
  - Add button opening the block modal.
  - Delete requires `Alert` confirmation.

## Form contract

- `TimeBlockFormModal` receives `{ visible, onClose }`.
- Fields: mode (range/full-day), date, start/end (range), reason.
- Validation errors shown inline; API errors shown as alert text.
- Save button shows pending state and closes on success.

## Data guarantees

- UI never calls `apiRequest`/`useQuery` directly.
- `startAt`/`endAt` use `${date}T${time}:00`.
- Full-day blocks use `00:00` and `23:59`.
- Query keys: `['availability', tenantId]` and `['time-blocks', tenantId]`.
