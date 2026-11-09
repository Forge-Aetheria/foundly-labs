---
description: "Task list for the Book subscription checkout and plan management tab"
---

# Tasks: Subscription Checkout & Plan Management

**Input**: `specs/book/025-subscription-checkout/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Incluidos porque la spec exige validación de estados, checkout, formulario manual, historial y accesibilidad. Se escriben antes de la implementación correspondiente cuando el orden lo permite.

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y validación independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario (US1, US2, US3, US4)
- Todas las tareas incluyen la ruta exacta del archivo o workspace afectado

## Path Conventions

- Book: `apps/book/src/`
- API (dependencia): `apps/api/src/modules/billing/`
- Specs: `specs/book/025-subscription-checkout/`
- Snapshots: `apps/book/codegen.schema.gql`, `apps/mobile/codegen.schema.gql`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el estado de partida y preparar la dependencia de API.

- [X] T001 Ejecutar los gates base de `apps/book` y `apps/api` (`typecheck`, `lint`, `test`) y registrar el estado inicial.
- [X] T002 [P] Confirmar que la API expondrá `billingInstructions` y que Book consumirá el contrato de `specs/api/023-subscription-payments`.
- [X] T003 [P] Añadir a `apps/api/.env.example` y `render.yaml` las variables `BILLING_MANUAL_BANK`, `BILLING_MANUAL_CEDULA`, `BILLING_MANUAL_PHONE`, `BILLING_MANUAL_RATE_VES_PER_USD` y `BILLING_MANUAL_NOTE`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API de instrucciones, códigos de error, documentos GraphQL, tipos y pestaña base que necesitan todas las historias.

**CRITICAL**: Ninguna historia puede completarse sin esta fase.

- [X] T004 [P] Añadir en `apps/api/src/modules/billing/billing.types.ts` los tipos `BillingPlanInstructions`, `ManualPaymentInstructions` y `BillingInstructions`.
- [X] T005 [P] Ampliar `apps/api/src/modules/billing/billing.config.ts` con banco, cédula/RIF, teléfono, tasa y nota manual desde variables de entorno, fallando en cerrado si faltan.
- [X] T006 Implementar `getInstructions()` en `apps/api/src/modules/billing/billing.service.ts` y la query `billingInstructions` en `apps/api/src/modules/billing/billing.resolver.ts` con `@RequireAuth()` + `@AllowInactiveTenant()`.
- [X] T007 [P] Crear `apps/api/src/modules/billing/billing.instructions.spec.ts` para cubrir datos configurados, configuración faltante → `STATE_ERROR`, aislamiento por identidad y tenant suspendido permitido.
- [X] T008 [P] Ampliar `apps/book/src/shared/types/result.ts` con `PLAN_LIMIT_REACHED`, `PAYMENT_PROVIDER_ERROR`, `PAYMENT_NOT_PENDING`, `PAYMENT_DUPLICATE_REFERENCE` y `PAYMENT_AMOUNT_MISMATCH`.
- [X] T009 [P] Actualizar `apps/book/src/shared/api/client.ts` (`mapErrorCode`) y `apps/book/src/shared/api/error-surface.ts` con mensajes/tratamiento para los nuevos códigos.
- [X] T010 Crear `apps/book/src/modules/subscription/subscription.graphql` con `MySubscription`, `BillingInstructions`, `MyPaymentTransactions`, `CreatePaypalSubscriptionOrder`, `CreateBinancePaymentOrder` y `SubmitManualPayment`.
- [X] T011 Sincronizar `apps/book/codegen.schema.gql` y `apps/mobile/codegen.schema.gql` con el SDL actualizado y ejecutar `corepack pnpm --filter @foundly/book codegen` y `corepack pnpm --filter @foundly/mobile codegen`.
- [X] T012 [P] Crear `apps/book/src/modules/subscription/utils/types.ts` y `apps/book/src/modules/subscription/utils/format.ts` con view models y formateo de importes/fechas/estados.
- [X] T013 [P] Añadir a `apps/book/src/shared/api/query-client.ts` las claves `subscription`, `billingInstructions` y `paymentTransactions`.
- [X] T014 Añadir `suscripcion` a `CONFIG_TABS`/`TAB_META` en `apps/book/src/modules/configuration/ConfigurationView.tsx` y montar `SubscriptionView` con `embedded`.
- [X] T015 [P] Ampliar `apps/book/src/modules/configuration/tests/ConfigurationView.test.tsx` (o crear si no existe) para parsear y renderizar la pestaña `suscripcion`.

**Checkpoint**: API de instrucciones, tipos, codegen, errores y pestaña base listos.

---

## Phase 3: User Story 1 - Ver el plan actual y el uso (Priority: P1) — MVP

**Goal**: Mostrar plan, plan efectivo, estado, vencimiento y uso de servicios/equipo.

**Independent Test**: Abrir `?tab=suscripcion` con Free, Pro y vencido; comprobar plan, estado, vencimiento y límites.

### Tests for User Story 1

- [X] T016 [P] [US1] Crear `apps/book/src/modules/subscription/tests/services.test.ts` para `getSubscription` y el mapeo de límites/estado/vencimiento.
- [X] T017 [P] [US1] Crear `apps/book/src/modules/subscription/tests/SubscriptionView.test.tsx` con Free, Pro, vencido y pago pendiente.

### Implementation for User Story 1

- [X] T018 [US1] Implementar `getSubscription()` en `apps/book/src/modules/subscription/services.ts` usando `apiRequestAuthed` y tipos codegen.
- [X] T019 [US1] Implementar `useSubscription` en `apps/book/src/modules/subscription/hooks.ts`.
- [X] T020 [P] [US1] Crear `apps/book/src/modules/subscription/components/PlanSummaryCard.tsx` con plan, estado, vencimiento y uso.
- [X] T021 [P] [US1] Crear `apps/book/src/modules/subscription/components/PlanBenefits.tsx` con beneficios Free/Pro y CTA de upgrade.
- [X] T022 [US1] Crear `apps/book/src/modules/subscription/SubscriptionView.tsx` y conectar resumen, carga y error.

**Checkpoint**: La pestaña muestra el plan y el uso correctamente para todos los estados.

---

## Phase 4: User Story 2 - Pagar con PayPal o Binance Pay (Priority: P1)

**Goal**: Crear checkout de PayPal/Binance, redirigir y reflejar el estado pendiente/confirmado.

**Independent Test**: Pulsar PayPal y Binance; verificar creación de orden y redirección; al volver, estado pendiente y actualización tras confirmación.

### Tests for User Story 2

- [X] T023 [P] [US2] Ampliar `apps/book/src/modules/subscription/tests/services.test.ts` con `createPaypalOrder`/`createBinanceOrder` y error de proveedor.
- [X] T024 [P] [US2] Crear `apps/book/src/modules/subscription/tests/PaymentMethodSelector.test.tsx` con botones, loading y redirección.

### Implementation for User Story 2

- [X] T025 [US2] Implementar `createPaypalOrder()` y `createBinanceOrder()` en `apps/book/src/modules/subscription/services.ts`.
- [X] T026 [US2] Implementar `useCreatePaypalOrder` y `useCreateBinanceOrder` en `apps/book/src/modules/subscription/hooks.ts`.
- [X] T027 [P] [US2] Crear `apps/book/src/modules/subscription/components/PaymentMethodSelector.tsx` con PayPal/Binance y estados de carga.
- [X] T028 [US2] Implementar la redirección a `checkoutUrl` y el retorno `checkout=return` en `SubscriptionView`/hooks, invalidando y refrescando queries.
- [X] T029 [US2] Integrar el selector de métodos y el aviso de checkout en `SubscriptionView.tsx`.

**Checkpoint**: PayPal/Binance crean orden, redirigen y la UI no asume activación hasta confirmación.

---

## Phase 5: User Story 3 - Reportar pago manual en bolívares (Priority: P1)

**Goal**: Mostrar instrucciones bancarias y registrar Pago Móvil/Transferencia como pendiente.

**Independent Test**: Ver instrucciones, enviar pago válido, comprobar `PENDING_APPROVAL` y plan sin cambios; referencia duplicada inline.

### Tests for User Story 3

- [X] T030 [P] [US3] Crear `apps/book/src/modules/subscription/tests/schemas.test.ts` para validar gateway, referencia, banco, monto, moneda y teléfono.
- [X] T031 [P] [US3] Crear `apps/book/src/modules/subscription/tests/ManualPaymentForm.test.tsx` con validación, envío, loading y error de referencia duplicada.

### Implementation for User Story 3

- [X] T032 [US3] Crear `apps/book/src/modules/subscription/utils/schemas.ts` con `manualPaymentSchema`.
- [X] T033 [US3] Implementar `submitManualPayment()` en `apps/book/src/modules/subscription/services.ts` y el mapeo del error `PAYMENT_DUPLICATE_REFERENCE` a `fields.referenceNumber`.
- [X] T034 [US3] Implementar `useSubmitManualPayment` en `apps/book/src/modules/subscription/hooks.ts` con invalidación del historial.
- [X] T035 [P] [US3] Crear `apps/book/src/modules/subscription/components/ManualPaymentInstructions.tsx` con banco, cédula/RIF, teléfono, tasa y nota.
- [X] T036 [US3] Crear `apps/book/src/modules/subscription/components/ManualPaymentForm.tsx` con gateway, referencia, banco, monto, moneda y teléfono.
- [X] T037 [US3] Integrar instrucciones y formulario manual en `SubscriptionView.tsx`/`PaymentMethodSelector`.

**Checkpoint**: El pago manual queda pendiente, es visible y no activa el plan.

---

## Phase 6: User Story 4 - Estado e historial de pagos (Priority: P2)

**Goal**: Mostrar el historial de transacciones con estados y paginación.

**Independent Test**: Con transacciones en varios estados, comprobar orden, etiquetas, importes, moneda, referencia y paginación.

### Tests for User Story 4

- [X] T038 [P] [US4] Ampliar `apps/book/src/modules/subscription/tests/services.test.ts` con `listPaymentTransactions` y mapeo de estados.
- [X] T039 [P] [US4] Crear `apps/book/src/modules/subscription/tests/PaymentHistoryList.test.tsx` con estados, vacío y “Cargar más”.

### Implementation for User Story 4

- [X] T040 [US4] Implementar `listPaymentTransactions(limit, offset)` en `apps/book/src/modules/subscription/services.ts`.
- [X] T041 [US4] Implementar `usePaymentTransactions` en `apps/book/src/modules/subscription/hooks.ts`.
- [X] T042 [US4] Crear `apps/book/src/modules/subscription/components/PaymentHistoryList.tsx` con etiquetas/tonos por estado y paginación.
- [X] T043 [US4] Integrar el historial en `SubscriptionView.tsx`.

**Checkpoint**: El historial refleja fielmente el estado de los pagos y permite paginar.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Enlaces de upgrade, accesibilidad, snapshots y gates.

- [X] T044 Añadir en `apps/book/src/shared/api/error-surface.ts` o en los módulos de servicios/equipo un enlace accionable a `?tab=suscripcion` para `PLAN_LIMIT_REACHED`.
- [X] T045 [P] Ampliar `apps/book/src/modules/subscription/tests/SubscriptionView.test.tsx` con `vitest-axe` y navegación por teclado.
- [X] T046 Sincronizar `apps/book/codegen.schema.gql` y `apps/mobile/codegen.schema.gql` si el SDL de la API cambió; regenerar tipos.
- [X] T047 Ejecutar `corepack pnpm --filter @foundly/book typecheck`, `lint`, `test` y `build`; corregir regresiones.
- [X] T048 Validar los escenarios de `specs/book/025-subscription-checkout/quickstart.md` (estados, checkout, manual, historial y errores).
- [X] T049 Revisar que `plan.md`, `data-model.md` y `contracts/` describen el comportamiento implementado; corregir divergencias reales.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational; es el MVP visual.
- **US2 (Phase 4)**: depende de Foundational y US1 para montar el selector en la vista.
- **US3 (Phase 5)**: depende de Foundational y US1 para mostrar instrucciones y formulario.
- **US4 (Phase 6)**: depende de Foundational y US1; puede avanzar en paralelo con US2/US3.
- **Polish (Phase 7)**: depende de todas las historias.

### User Story Dependencies

- **US1 (P1)**: no depende de otras historias.
- **US2 (P1)**: depende de US1 para el contenedor de la vista.
- **US3 (P1)**: depende de US1 para el contenedor de la vista.
- **US4 (P2)**: depende de US1; puede validarse con transacciones seed o API.

### Parallel Opportunities

- T004/T005 y T008/T009/T012/T013 pueden ir en paralelo tras Setup.
- T016/T017 (tests US1) y T020/T021 (componentes US1) pueden ir en paralelo.
- T023/T024 (tests US2) y T027 (selector US2) pueden ir en paralelo.
- T030/T031 (tests US3) y T035 (instrucciones US3) pueden ir en paralelo.
- T038/T039 (tests US4) y T042 (lista US4) pueden ir en paralelo.

---

## Parallel Example: User Story 1

```text
Task: "Crear services.test.ts para getSubscription"
Task: "Crear SubscriptionView.test.tsx con Free/Pro/vencido"
Task: "Crear PlanSummaryCard.tsx"
Task: "Crear PlanBenefits.tsx"
```

## Parallel Example: User Story 3

```text
Task: "Crear schemas.test.ts para manualPaymentSchema"
Task: "Crear ManualPaymentForm.test.tsx"
Task: "Crear ManualPaymentInstructions.tsx"
```

---

## Implementation Strategy

### MVP First

El MVP es **US1**: la pestaña visible con plan, estado, vencimiento y uso. Después se añaden los dos caminos de pago (US2/US3) y el historial (US4).

### Incremental Delivery

1. Setup + Foundational → API de instrucciones, tipos y pestaña base.
2. US1 → resumen del plan.
3. US2 → PayPal/Binance.
4. US3 → pago manual.
5. US4 → historial.
6. Polish → enlaces, accesibilidad y gates.

---

## Notes

- No se hardcodean precios, tasas ni datos bancarios; vienen de `billingInstructions`.
- No se guardan datos de pago en `localStorage`.
- La vista usa exclusivamente `services.ts`/`hooks.ts` y tipos codegen.
- Un pago pendiente nunca se presenta como plan activo.
- El retorno del checkout debe apuntar a `/admin/configuracion?tab=suscripcion&checkout=return`.
