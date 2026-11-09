# Implementation Plan: Subscription Payments & Billing

**Branch**: `023-subscription-payments` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/api/023-subscription-payments/spec.md`

## Summary

Añadir el cobro de suscripciones de Foundly Book sobre la infraestructura actual de `Tenant`/`SubscriptionService`. Se introduce `PaymentTransaction` con enums propios (`PaymentGateway`, `PaymentStatus`) para no romper `SubscriptionStatus`, un módulo `billing` en GraphQL para crear órdenes PayPal/Binance y reportar pagos manuales, aprobación manual por Super Admin, y un controlador HTTP aislado para webhooks de PayPal/Binance con validación de firma e idempotencia. Al completarse un pago se actualizan `subscriptionPlan`, `subscriptionStatus` y `subscriptionExpiresAt` del tenant de forma atómica. El importe y la duración del plan son configuración del servidor; no se inventan precios.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto, Node.js 20+, NestJS 11 + Apollo GraphQL

**Primary Dependencies**: `@nestjs/graphql`, Prisma (`@foundly/database`), `jose`/Supabase JWT existente, `fetch` nativo de Node, `node:crypto` para firmas; sin SDKs nuevos

**Storage**: PostgreSQL; nueva tabla `PaymentTransaction` y enums `PaymentGateway`/`PaymentStatus`; sin cambios destructivos en `Tenant` ni en `SubscriptionStatus`

**Testing**: Vitest; store seam en memoria para billing, clientes de proveedor falsos, tests de servicio/guard/resolver y supertest para webhooks; gates de API y snapshots de codegen

**Target Platform**: Servidor Node.js (API); las operaciones de cliente siguen en GraphQL y los webhooks en HTTP

**Project Type**: Monorepo — backend GraphQL (`apps/api`) + paquete Prisma (`packages/database`) + snapshots de consumidores (`apps/book`, `apps/mobile`)

**Performance Goals**: confirmación de webhook procesada en < 5 s; activación/extensión consistente en una transacción atómica; lista de transacciones acotada y paginada

**Constraints**: sin nuevos SDKs; secretos solo en servidor; validación de firma de PayPal/Binance; idempotencia obligatoria; importes y duración determinados por el servidor; precios no ratificados no se exponen; UI de Book fuera de esta spec

**Scale/Scope**: una tabla de transacciones, cuatro gateways (PayPal, Binance, Pago Móvil, Transferencia), cuatro mutaciones GraphQL, una query de historial y dos webhooks HTTP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
| --- | --- | --- |
| §1 / §2.III | Spec en `specs/api/023-…`, referencia `specs/business-model.md` y se subordina a la gobernanza global | PASS |
| §5.I SDD | Spec y plan aprobados antes de código | PASS |
| §5.IV Strict typing | Store/provider seams tipados; sin `any`; validación de inputs | PASS |
| §5.VI Data layer | Book no se modifica en esta spec; sus snapshots solo se sincronizan | PASS |
| §5.VII Reuse | Se reutilizan `Tenant`, `SubscriptionService`, `SubscriptionPlan`, `RequireAuth`, `RequireSuperAdmin`, logger y Prisma | PASS |
| §3 Monorepo boundaries | Billing en `apps/api`; persistencia en `packages/database`; sin imports app→app | PASS |
| §6/§7 | Sin cambios visuales ni rutas de UI | PASS (N/A) |
| code-rules §10 | API mantiene specs colocalizados `*.spec.ts`; sin tests de UI nuevos | PASS |

Sin violaciones que requieran `Complexity Tracking`.

**Post-design re-check (Phase 1)**: PASS — el diseño separa estado de pago de estado de suscripción, no modifica el enum existente, aísla los webhooks en HTTP con raw body, usa provider seams sin SDKs y mantiene los precios como configuración del servidor.

## Project Structure

### Documentation (this feature)

```text
specs/api/023-subscription-payments/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── billing.graphql.md
│   ├── billing-webhooks.contract.md
│   └── payment-provider.contract.md
├── quickstart.md
├── checklists/requirements.md
└── spec.md
```

### Source Code (repository root)

```text
packages/database/prisma/
├── schema.prisma                              # + PaymentGateway, PaymentStatus, PaymentTransaction
└── migrations/<timestamp>_add_subscription_payments/
    └── migration.sql                          # CREATE TYPE/TABLE + indexes + FK

apps/api/src/
├── main.ts                                    # rawBody habilitado para webhooks
├── app.module.ts                              # registra BillingModule
├── schema.gql                                 # SDL regenerado
└── modules/billing/
    ├── billing.module.ts
    ├── billing.resolver.ts                    # mutaciones/queries GraphQL
    ├── billing.service.ts                     # creación, webhook, aprobación, activación
    ├── billing.store.ts                       # BILLING_STORE + PrismaBillingStore
    ├── billing.types.ts                       # enums/objetos/inputs GraphQL
    ├── billing.config.ts                      # plan, duración, secretos y URLs
    ├── billing.errors.ts                      # errores estables de billing
    ├── billing-webhook.controller.ts          # POST /api/v1/billing/webhooks/paypal|binance
    ├── manual-payment.notifier.ts             # log estructurado + alerta opcional
    ├── providers/
    │   ├── payment-provider.ts                # interfaz createCheckout/verifyWebhook
    │   ├── paypal.provider.ts                 # PayPal Subscriptions API
    │   └── binance.provider.ts                # Binance Pay API
    └── *.spec.ts                              # servicio, store, providers, webhooks

apps/api/.env.example                          # + PAYPAL_*, BINANCE_*, BILLING_*
render.yaml                                    # + variables de billing
apps/book/codegen.schema.gql                   # snapshot sincronizado (sin UI)
apps/mobile/codegen.schema.gql                 # snapshot sincronizado (sin UI)
```

**Structure Decision**: Nuevo módulo `billing` en `apps/api` con un store seam y provider seams. Las operaciones de cliente se exponen por GraphQL con `@RequireAuth` (y `@AllowInactiveTenant()` para permitir renovación de un tenant suspendido). La aprobación manual usa `@RequireSuperAdmin()`. Los webhooks viven en un controlador HTTP separado porque requieren raw body y verificación de firma. `PaymentTransaction` guarda el historial y el estado del pago; `Tenant` sigue siendo la fuente del plan efectivo que consume `SubscriptionService`.

## Complexity Tracking

> Sin violaciones que justificar.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
