# Contract — Advance Payments, Booking Calendar & Agenda Control (module data layer + views)

**Feature**: `specs/book/017-advance-payments-booking`

Repository rule (constitution §5.VI): the UI calls **only** these functions/types; it never imports the transport, codegen documents, or the Server Actions directly. All API DTOs are codegen-only. All operations consume the API `016` surface (`specs/api/016-advance-payments`).

## 1. Configuration module — `modules/configuration/`

### `actions.ts` (server-only)

```ts
listPaymentMethods(): Promise<ActionResult<PaymentMethod[]>>;                 // authenticated (myPaymentMethods)
upsertPaymentMethod(input: unknown): Promise<ActionResult<PaymentMethod>>;    // authenticated (upsertPaymentMethod)
deletePaymentMethod(input: unknown): Promise<ActionResult<{ id: string }>>;   // authenticated (deletePaymentMethod)
listPublicPaymentMethods(tenantSlug: string): Promise<ActionResult<PaymentMethod[]>>; // public active-only
```

- Reads/writes go through `apiRequestAdmin`; the public read through `apiRequest`.
- `upsertPaymentMethod` validates with `paymentMethodSchema` (→ `VALIDATION_ERROR`); sessions are handled globally by `apiRequestAdmin`.

### `hooks.ts` (`'use client'`)

```ts
useFetchPaymentMethods(): () => Promise<ActionResult<PaymentMethod[]>>;
useUpsertPaymentMethod(): (input: unknown) => Promise<ActionResult<PaymentMethod>>;
useDeletePaymentMethod(): (input: unknown) => Promise<ActionResult<{ id: string }>>;
```

### `ConfigurationView.tsx` (server) + `components/PaymentsConfig.tsx` (client)

- **Server view**: resolves the tenant and calls `listPaymentMethods()`, passing methods + error.
- **`PaymentsConfig` props**: `{ methods: PaymentMethod[]; error?: string | null }`.
- **Behaviors**: three method cards (Pago Móvil / Transferencia / Binance) with an `active` `Switch`, `details` and `instructions` fields, a pending save, success toast + `router.refresh()`, and a clean error surface.

## 2. Services module — `modules/services/` (advance rule)

```ts
serviceSchema: { name; description?; durationMinutes; priceCents; category?;
                 requiresAdvance: boolean; advanceKind: 'fixed'|'percent'|null; advanceValue: number|null };
```

- `mapMyService` maps `requiresAdvance`/`advanceKind`/`advanceValue` from the API `MyService`.
- `ServiceCatalog` shows a "Requiere adelanto" `Switch`; when enabled, a kind selector and a value field; the table shows an "Adelanto" badge.

## 3. Public booking module — `modules/public-booking/`

### `actions.ts` (server-only)

```ts
fetchOfferedSlots(input): Promise<SlotDay[]>;                                  // existing (range supported)
listPublicPaymentMethods(tenantSlug): Promise<ActionResult<PaymentMethod[]>>;  // NEW (public active-only)
bookPublicAppointment(input): Promise<ActionResult<Appointment>>;              // carries the optional advance
```

- `bookPublicAppointment` adds the optional `payment` payload (`methodType`, `amountCents`, `reference`, `proofUrl`) and returns the created `Appointment` (with `payment`).
- `advancePaymentSchema` validates the payload; the API is the final authority (method active + amount match).

### `hooks.ts` (`'use client'`)

```ts
useFetchOfferedSlots(): (input: unknown) => Promise<SlotDay[]>;
useBookAppointment(): (input: unknown) => Promise<ActionResult<Appointment>>;
useUploadPaymentProof(): (file: File) => Promise<ActionResult<{ url: string }>>;   // NEW (Supabase Storage)
```

### `utils/uploadProof.ts`

```ts
export const PAYMENT_PROOF_BUCKET = 'payment-proofs';
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PROOF_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export function validateProofFile(file: File): { ok: true } | { ok: false; message: string };
export async function uploadPaymentProof(file: File, tenantSlug: string): Promise<ActionResult<{ url: string }>>;
```

### `dialogs/CalendarStep.tsx` (client)

- **Props**: `{ tenantSlug; serviceId; resourceId?; value; onSelect(slot); onContinue(); onBack() }`.
- **Behavior**: a real month grid; fetches availability for the visible month via `useFetchOfferedSlots`; days without availability are disabled; selecting a day reveals its slots below; choosing a slot sets `value`; "Continuar" is disabled until a slot is chosen.

### `dialogs/PaymentStep.tsx` (client)

- **Props**: `{ tenantSlug; service: PublicService; value: AdvancePaymentDraft | null; onChange(draft); onContinue(); onBack() }`.
- **Behavior**: lists the tenant's **active** methods (via `useFetchPaymentMethods`/public read); requires a method, amount (pre-filled from the service rule), reference and proof; uploads the file via `useUploadPaymentProof`; "Continuar" is disabled until complete; with no active method it shows a blocking message.

### `dialogs/BookingFlow.tsx` (client)

- Composes the step list dynamically from `service.requiresAdvance`; passes the payment payload to `bookPublicAppointment`; retains the entered data on failure.

## 4. Agenda module — `modules/agenda/`

### `actions.ts` (server-only)

```ts
listAgenda(filter: { from: Date; to: Date; resourceId?: string }): Promise<ActionResult<Appointment[]>>;  // myAppointments (auth)
createAppointment(input): Promise<ActionResult<Appointment>>;       // createMyAppointment (auth, admin, exempt)
cancelAppointment(input): Promise<ActionResult<Appointment>>;       // apiRequestAdmin
changeAppointmentStatus(input): Promise<ActionResult<Appointment>>; // apiRequestAdmin
rescheduleAppointment(input): Promise<ActionResult<Appointment>>;   // NEW (apiRequestAdmin)
```

- `mapAppointment` maps the embedded `payment` and `notifications`.
- Controls go through `apiRequestAdmin` (the API `016` mutations require auth).

### `hooks.ts` (`'use client'`)

```ts
useCreateAppointment(): (input: unknown) => Promise<ActionResult<Appointment>>;
useCancelAppointment(): (input: unknown) => Promise<ActionResult<Appointment>>;
useChangeAppointmentStatus(): (input: unknown) => Promise<ActionResult<Appointment>>;
useRescheduleAppointment(): (input: unknown) => Promise<ActionResult<Appointment>>;  // NEW
```

### `AgendaView.tsx` (server) + `components/Agenda.tsx` (client)

- **Server view**: reads `from`/`to` `searchParams` (default today → last day of the current month) and calls `listAgenda` + `listServices` + `listStaff`; maps rows with `payment`/`notifications`.
- **`Agenda` props**: `{ appointments: AgendaRow[]; range: { from; to }; services; resources; error? }`.
- **Behaviors**: two `type="date"` inputs (`desde`/`hasta`) applied via `router.push('/admin/agenda?from=…&to=…')`; status filter; a detail modal with the **Adelanto** section (method, amount, reference, proof preview + link fallback); **Aceptar**/**Rechazar**/**Reagendar** actions with pending/disable, toasts and revalidation.

## 5. Error presentation

| Error | Surface |
|---|---|
| `VALIDATION_ERROR` | inline field errors + yellow toast (complementary) |
| `CONFLICT` (booking/reschedule) | precise inline message ("Ese hueco ya está ocupado…") |
| `NOT_FOUND` / transient | red toast and/or `ApiErrorDialog` |
| `UNAUTHENTICATED` | global session handler (redirect) — never inline |
| upload failure | inline message; entered data preserved; retry allowed |
| success | green toast + close/advance + `router.refresh()` where server reads are affected |

## 6. RSC boundary

- `PaymentsConfig`, `CalendarStep`, `PaymentStep`, `BookingFlow`, `Agenda` and the detail/reschedule modals are `'use client'`; they receive only serializable props (arrays/objects/strings). No functions cross the Server → Client boundary (`code-rules.md` §8).
