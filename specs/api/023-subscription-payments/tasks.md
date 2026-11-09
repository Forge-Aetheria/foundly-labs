---
description: "Task list for subscription payments and billing"
---

# Tasks: Subscription Payments & Billing

**Input**: `specs/api/023-subscription-payments/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Incluidos porque el plan exige validación de firma, idempotencia, activación atómica y aislamiento multi-tenant. Se escriben antes de la implementación de cada historia cuando el orden lo permita.

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y validación independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario (US1, US2, US3, US4)
- Todas las tareas incluyen la ruta exacta del archivo o workspace afectado

## Path Conventions

- API: `apps/api/src/`
- Database: `packages/database/prisma/`
- Specs: `specs/api/023-subscription-payments/`
- Snapshots: `apps/book/codegen.schema.gql`, `apps/mobile/codegen.schema.gql`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el estado de partida y preparar configuración compartida.

- [X] T001 Ejecutar los gates base de `apps/api` (`typecheck`, `lint`, `test`) y registrar el estado inicial.
- [X] T002 [P] Añadir a `apps/api/.env.example` y `render.yaml` las variables de billing: PayPal, Binance, plan Pro, URLs de checkout y alerta operativa.
- [X] T003 [P] Confirmar que `SubscriptionStatus` existente no se modifica y que `PaymentStatus`/`PaymentGateway` se añaden como enums nuevos en `packages/database/prisma/schema.prisma`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modelo de datos, store, configuración, errores y rutina atómica que necesitan todas las historias.

**CRITICAL**: Ninguna historia puede completarse sin esta fase.

- [X] T004 Añadir `PaymentGateway` (`PAYPAL`, `BINANCE`, `PAGO_MOVIL`, `TRANSFERENCIA`) y `PaymentStatus` (`PENDING`, `PENDING_APPROVAL`, `COMPLETED`, `REJECTED`, `FAILED`) en `packages/database/prisma/schema.prisma`, preservando `SubscriptionStatus`.
- [X] T005 Añadir el modelo `PaymentTransaction` en `packages/database/prisma/schema.prisma` con: `id`, `tenantId`, `plan`, `gateway`, `status`, `amount Decimal @db.Decimal(12,2)`, `currency String` (`USD`/`VES`), `gatewayOrderId String?`, `referenceNumber String?`, `metadata Json?`, `expiresAt DateTime?`, `paidAt DateTime?`, `reviewedBy String?`, `reviewedAt DateTime?`, `createdAt`, `updatedAt`; relaciones, índices y `@@unique([gateway, gatewayOrderId])`.
- [X] T006 [P] Crear la migración `packages/database/prisma/migrations/<timestamp>_add_subscription_payments/migration.sql` con enums, tabla, FK a `Tenant` con `ON DELETE CASCADE`, índices y unique compuesto.
- [X] T007 Ejecutar `corepack pnpm --filter @foundly/database db:generate` y aplicar la migración; verificar que `Tenant` expone `paymentTransactions`.
- [X] T008 Crear `apps/api/src/modules/billing/billing.types.ts` con enums/objetos/inputs GraphQL (`PaymentGateway`, `PaymentStatus`, `CheckoutSession`, `PaymentTransaction`, `SubmitManualPaymentInput`) y `amount` serializado como `String`.
- [X] T009 [P] Crear `apps/api/src/modules/billing/billing.config.ts` para `BILLING_PRO_AMOUNT_USD`, `BILLING_PRO_DURATION_DAYS`, URLs de checkout/alertas y secretos PayPal/Binance; fallar de forma cerrada si falta el plan.
- [X] T010 [P] Crear `apps/api/src/modules/billing/billing.store.ts` con `BILLING_STORE`, `BillingStore` y `PrismaBillingStore` (`create`, `findById`, `findByGatewayOrderId`, `listByTenant`, `findManualByReference`, `completeTransaction`).
- [X] T011 [P] Crear `apps/api/src/modules/billing/billing.errors.ts` y añadir `PAYMENT_PROVIDER_ERROR`, `PAYMENT_NOT_PENDING`, `PAYMENT_DUPLICATE_REFERENCE` y `PAYMENT_AMOUNT_MISMATCH` a la allowlist de `apps/api/src/graphql/errors.ts`.
- [X] T012 Crear `apps/api/src/modules/billing/billing.service.ts` con la rutina atómica `completeTransaction`: `expiresAt = max(now, tenant.subscriptionExpiresAt ?? now) + durationDays`, marcar `COMPLETED`, `paidAt`, y actualizar `Tenant.subscriptionPlan=PRO`, `subscriptionStatus=active`, `subscriptionExpiresAt`.
- [X] T013 Crear `apps/api/src/modules/billing/billing.module.ts` y registrar `BillingModule` en `apps/api/src/app.module.ts`; incluir el controlador de webhooks y los providers.
- [X] T014 [P] Habilitar `rawBody: true` en `apps/api/src/main.ts` para que los webhooks puedan verificar la firma sobre el cuerpo original.
- [X] T015 Crear `apps/api/src/modules/billing/billing.test-store.ts` con un store en memoria para tests DB-free.

**Checkpoint**: Esquema, store, configuración, errores, módulo y activación atómica listos.

---

## Phase 3: User Story 1 - Pago automatizado PayPal/Binance (Priority: P1) — MVP

**Goal**: Crear órdenes de PayPal/Binance, recibir webhooks firmados e idempotentes, y activar/extender la suscripción al completarse el pago.

**Independent Test**: Crear una orden de cada proveedor, simular un webhook válido y comprobar que la transacción pasa a `COMPLETED` y el tenant a Pro; reenviar el webhook no duplica la vigencia.

### Tests for User Story 1

- [X] T016 [P] [US1] Crear `apps/api/src/modules/billing/providers/payment-provider.spec.ts` con tests de creación de checkout y verificación de firma inválida para los providers falsos.
- [X] T017 [P] [US1] Crear `apps/api/src/modules/billing/billing.service.spec.ts` con tests de `createPaypalSubscriptionOrder`, `createBinancePaymentOrder`, webhook completado, webhook duplicado y activación de suscripción.
- [X] T018 [P] [US1] Crear `apps/api/src/modules/billing/billing-webhook.controller.spec.ts` con firma inválida → `401`, evento válido → `200`, duplicado → `200` sin segunda extensión y evento fallido → sin Pro.

### Implementation for User Story 1

- [X] T019 [P] [US1] Crear `apps/api/src/modules/billing/providers/payment-provider.ts` con la interfaz `createCheckout`/`verifyWebhook` y tipos de resultado.
- [X] T020 [P] [US1] Implementar `apps/api/src/modules/billing/providers/paypal.provider.ts` usando PayPal Subscriptions API con `PAYPAL_PLAN_ID`, `fetch` nativo y timeout acotado.
- [X] T021 [P] [US1] Implementar `apps/api/src/modules/billing/providers/binance.provider.ts` con creación de orden Binance Pay y verificación de firma/certificado.
- [X] T022 [US1] Implementar `createPaypalSubscriptionOrder` y `createBinancePaymentOrder` en `apps/api/src/modules/billing/billing.service.ts`: transacción `PENDING`, importe/duración del servidor, `gatewayOrderId` y checkout.
- [X] T023 [US1] Implementar el procesamiento de webhooks en `apps/api/src/modules/billing/billing.service.ts`: localizar por `gatewayOrderId`, validar importe/moneda, completar o fallar, y no duplicar si ya está `COMPLETED`.
- [X] T024 [US1] Crear `apps/api/src/modules/billing/billing-webhook.controller.ts` con `POST /api/v1/billing/webhooks/paypal` y `/binance`, raw body, firma y códigos HTTP del contrato.
- [X] T025 [US1] Crear `apps/api/src/modules/billing/billing.resolver.ts` con las mutaciones `createPaypalSubscriptionOrder` y `createBinancePaymentOrder` usando `@RequireAuth()` + `@AllowInactiveTenant()`.
- [X] T026 [US1] Registrar providers, controlador y resolver en `apps/api/src/modules/billing/billing.module.ts`.
- [X] T027 [US1] Ejecutar typecheck, tests y build de API; corregir regresiones de billing/auth.

**Checkpoint**: Los pagos automatizados crean checkout, confirman por webhook y activan la suscripción de forma idempotente.

---

## Phase 4: User Story 2 - Pago manual en bolívares (Priority: P1)

**Goal**: Registrar Pago Móvil/Transferencia en `PENDING_APPROVAL`, sin conceder plan, y alertar al operador.

**Independent Test**: Enviar un pago manual desde un tenant Free; la transacción queda pendiente, el plan no cambia y la alerta contiene referencia, importe, moneda y tenant.

### Tests for User Story 2

- [X] T028 [P] [US2] Ampliar `apps/api/src/modules/billing/billing.service.spec.ts` con `submitManualPayment`: crea `PENDING_APPROVAL`, no cambia `mySubscription`, valida `referenceNumber`/`bank`/`amount`/`currency`/`phone` y rechaza referencias duplicadas.
- [X] T029 [P] [US2] Crear `apps/api/src/modules/billing/manual-payment.notifier.spec.ts` para verificar log estructurado y POST opcional a `BILLING_ALERT_WEBHOOK_URL` sin secretos.
- [X] T030 [P] [US2] Añadir test de resolver `submitManualPayment` con tenant derivado del JWT y con tenant suspendido permitido por `@AllowInactiveTenant()`.

### Implementation for User Story 2

- [X] T031 [US2] Implementar `submitManualPayment` en `apps/api/src/modules/billing/billing.service.ts`: validar gateway manual, importe positivo, moneda `USD`/`VES`, referencia/banco/teléfono y crear `PENDING_APPROVAL` con metadata de auditoría.
- [X] T032 [P] [US2] Implementar `apps/api/src/modules/billing/manual-payment.notifier.ts`: log `manual_payment_pending` y POST opcional a `BILLING_ALERT_WEBHOOK_URL`.
- [X] T033 [US2] Añadir `submitManualPayment` a `apps/api/src/modules/billing/billing.resolver.ts` con `@RequireAuth()` + `@AllowInactiveTenant()`.
- [X] T034 [US2] Implementar `myPaymentTransactions(limit, offset)` en servicio/resolver, tenant-scoped, orden descendente y límite máximo 100.
- [X] T035 [US2] Registrar `ManualPaymentNotifier` en `billing.module.ts` y ejecutar tests de US2.

**Checkpoint**: Un pago manual queda pendiente, es auditable y no concede plan hasta aprobación.

---

## Phase 5: User Story 3 - Aprobación manual por Super Admin (Priority: P1)

**Goal**: Aprobar un pago manual pendiente y activar/extender la suscripción de forma atómica e idempotente.

**Independent Test**: Aprobar una transacción `PENDING_APPROVAL` como Super Admin y verificar `COMPLETED`, plan Pro y vencimiento; repetir no añade vigencia; usuario normal → `FORBIDDEN`.

### Tests for User Story 3

- [X] T036 [P] [US3] Ampliar `apps/api/src/modules/billing/billing.service.spec.ts` con aprobación válida, aprobación duplicada, transacción `REJECTED`/`FAILED` y transacción de otro tenant.
- [X] T037 [P] [US3] Añadir test de resolver `approveManualPayment` con `@RequireSuperAdmin`, usuario normal → `FORBIDDEN` y anónimo → `UNAUTHENTICATED`.

### Implementation for User Story 3

- [X] T038 [US3] Implementar `approveManualPayment` en `apps/api/src/modules/billing/billing.service.ts`: solo manual `PENDING_APPROVAL`, Super Admin, marcar `reviewedBy`/`reviewedAt` y usar `completeTransaction` atómica.
- [X] T039 [US3] Añadir `approveManualPayment(transactionId)` a `apps/api/src/modules/billing/billing.resolver.ts` con `@RequireSuperAdmin()`.
- [X] T040 [US3] Asegurar idempotencia: `COMPLETED` devuelve la transacción sin recalcular vigencia; `REJECTED`/`FAILED` → `PAYMENT_NOT_PENDING`.
- [X] T041 [US3] Ejecutar tests de US3 y verificar que un pago pendiente/fallido no concede Pro.

**Checkpoint**: La aprobación manual funciona, es segura e idempotente.

---

## Phase 6: User Story 4 - Seguridad, auditoría e idempotencia (Priority: P2)

**Goal**: Endurecer webhooks, conciliación y auditoría: firmas inválidas, importes inconsistentes, duplicados y eventos fallidos no conceden acceso.

**Independent Test**: Probar firma inválida, importe distinto, referencia duplicada y evento repetido; ningún caso duplica ni activa una suscripción.

### Tests for User Story 4

- [X] T042 [P] [US4] Añadir a `apps/api/src/modules/billing/billing.service.spec.ts` el caso de importe/moneda inconsistentes → sin activación y `PAYMENT_AMOUNT_MISMATCH`/revisión.
- [X] T043 [P] [US4] Añadir a `apps/api/src/modules/billing/billing-webhook.controller.spec.ts` pruebas de replay, payload inválido y evento no soportado.
- [X] T044 [P] [US4] Añadir pruebas de redacción/auditoría en `apps/api/src/modules/billing/manual-payment.notifier.spec.ts` (sin secretos ni teléfono completo en logs).

### Implementation for User Story 4

- [X] T045 [US4] Implementar la comprobación de importe/moneda en el procesamiento de webhooks y marcar revisión sin activar.
- [X] T046 [US4] Implementar la detección de `referenceNumber` duplicado por tenant/gateway en `submitManualPayment` con `PAYMENT_DUPLICATE_REFERENCE`.
- [X] T047 [US4] Añadir logs estructurados de webhook recibido/procesado/ignorado y aprobación/rechazo, sin secretos.
- [X] T048 [US4] Verificar que un tenant no puede listar ni aprobar transacciones de otro y que un usuario sin Super Admin no aprueba.

**Checkpoint**: Los flujos sensibles son auténticos, idempotentes y auditables.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Sincronización de contratos, documentación y gates finales.

- [X] T049 Sincronizar `apps/book/codegen.schema.gql` y `apps/mobile/codegen.schema.gql` con el SDL de la API y regenerar sus tipos; no se implementa UI de Book en esta spec.
- [X] T050 Verificar que `.env.example`, `render.yaml` y la documentación no exponen secretos y documentan las variables de billing.
- [X] T051 Ejecutar la validación de `specs/api/023-subscription-payments/quickstart.md` para pago manual, aprobación y webhooks simulados.
- [X] T052 Ejecutar gates finales: API `typecheck`, `lint`, `test`, `build`; Book/Mobile codegen y typecheck.
- [X] T053 Revisar que `plan.md`, `data-model.md` y `contracts/` describen el comportamiento implementado; corregir divergencias reales.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational; es el MVP de pagos automatizados.
- **US2 (Phase 4)**: depende de Foundational y de la rutina `completeTransaction` de US1/Foundational.
- **US3 (Phase 5)**: depende de Foundational y US2 (transacciones manuales); puede desarrollarse en paralelo con US1.
- **US4 (Phase 6)**: depende de US1 y US3.
- **Polish (Phase 7)**: depende de todas las historias.

### User Story Dependencies

- **US1 (P1)**: no depende de otras historias; requiere providers y webhook controller.
- **US2 (P1)**: no depende de US1 salvo la activación atómica compartida; puede validarse con `mySubscription` sin cambios.
- **US3 (P1)**: depende de US2 para tener transacciones manuales pendientes.
- **US4 (P2)**: transversal a US1/US3; se valida al final.

### Parallel Opportunities

- T004/T005/T006 (schema/migración) deben ser secuenciales; T008/T009/T010/T011 pueden ir en paralelo tras el schema.
- T016/T017/T018 (tests US1) y T019/T020/T021 (providers) pueden ir en paralelo tras Foundational.
- T028/T029/T030 (tests US2) pueden ir en paralelo.
- T036/T037 (tests US3) pueden ir en paralelo.
- T042/T043/T044 (tests US4) pueden ir en paralelo.

---

## Parallel Example: User Story 1

```text
# Tras Foundational, lanzar en paralelo:
Task: "Crear payment-provider.spec.ts con firma inválida y checkout"
Task: "Crear billing.service.spec.ts con webhook completado y duplicado"
Task: "Crear billing-webhook.controller.spec.ts con 401/200/duplicado"
```

## Parallel Example: User Story 2

```text
Task: "Ampliar billing.service.spec.ts con submitManualPayment"
Task: "Crear manual-payment.notifier.spec.ts"
Task: "Añadir test de resolver submitManualPayment"
```

---

## Implementation Strategy

### MVP First

El MVP operativo es **US1 + US2 + US3**, porque los tres son P1 y cubren los dos caminos de cobro y la aprobación manual. Orden recomendado:

1. Setup + Foundational.
2. US1: PayPal/Binance + webhooks.
3. US2: pago manual pendiente + alerta.
4. US3: aprobación manual.
5. US4: hardening y auditoría.
6. Polish: snapshots y gates.

### Incremental Delivery

1. Foundational → esquema/store/config listos.
2. US1 → cobro automatizado.
3. US2 → cobro local pendiente.
4. US3 → aprobación y activación.
5. US4 → seguridad/idempotencia.
6. Polish → contratos y validación final.

---

## Notes

- No se implementa UI de Book en esta spec; solo se sincronizan snapshots.
- Los precios/duraciones son configuración del servidor; no se hardcodean importes no ratificados.
- No se modifica el enum `SubscriptionStatus` existente.
- Los webhooks usan raw body y firma; los duplicados no conceden vigencia dos veces.
- Las transacciones de pago y la suscripción se actualizan de forma atómica.
