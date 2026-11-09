# Implementation Plan: Subscription Checkout & Plan Management

**Branch**: `025-subscription-checkout` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/book/025-subscription-checkout/spec.md`

## Summary

Añadir una pestaña **Suscripción** al hub `/admin/configuracion` de Book para mostrar plan, estado, vencimiento y uso; iniciar checkout PayPal/Binance; reportar Pago Móvil/Transferencia; y consultar el historial de pagos. La UI consume `mySubscription`, `myPaymentTransactions` y las mutaciones de billing de `specs/api/023-subscription-payments`. Se añade una pequeña consulta de API para las instrucciones de pago manual y el catálogo del plan, y se amplía el mapeo de errores de Book para los códigos de pago. No hay cambios de esquema ni dependencias nuevas.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto, React 19 + Vite, React Router 7

**Primary Dependencies**: TanStack Query 5, MUI 6 + `@foundly/ui`, `graphql-request` + `graphql-codegen` (`typed-document-node`), `zod` 4, Supabase Auth ya existente

**Storage**: ninguna persistencia local de pagos; estado en TanStack Query y sesión Supabase en `localStorage`

**Testing**: Vitest + React Testing Library + `vitest-axe`; tests de `services.ts`, `hooks.ts` y componentes de la pestaña

**Target Platform**: navegadores modernos; SPA cliente puro

**Project Type**: monorepo — SPA Book (`apps/book`) con dependencia pequeña de API (`apps/api/modules/billing`) para instrucciones de pago

**Performance Goals**: la pestaña carga el resumen en < 2 s con banda ancha típica; el historial usa paginación acotada; el estado pendiente se refresca en < 30 s o con acción manual

**Constraints**: precios/tasas/datos bancarios solo desde la API; sin secretos en el cliente; sin datos de pago en `localStorage`; sin llamadas directas a la API desde componentes; accesibilidad por teclado y mensajes anunciados

**Scale/Scope**: una pestaña, cuatro métodos de pago, resumen de plan, formulario manual, historial paginado y estados de error; una extensión pequeña de API y sincronización de snapshots codegen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
| --- | --- | --- |
| §1 / §2.III | Spec en `specs/book/025-…`, referencia `specs/business-model.md` y se subordina a la gobernanza global | PASS |
| §5.I SDD | Spec y plan antes de código | PASS |
| §5.II SPA | Toda la vista es cliente React/Vite; sin SSR ni Server Actions | PASS |
| §5.IV Strict typing | Servicios/hook/componentes tipados; Zod para input manual; sin `any` | PASS |
| §5.VI Module data layer | Nuevo módulo `subscription` con `services.ts`, `hooks.ts`, `subscription.graphql`, `components/`, `utils/`, `tests/`; UI solo usa hooks | PASS |
| §5.VII Reuse | Se reutilizan `ConfigurationView`/Tabs, `@foundly/ui`, `ActionResult`, `error-surface`, `Image`/`Link` compartidos y patrones de módulos existentes | PASS |
| §3 Monorepo | Book no importa `apps/api`; el contrato es GraphQL/codegen; el cambio de API es una dependencia documentada | PASS |
| §6 Design tokens | Se usan tokens y primitivas de `@foundly/ui`; sin colores mágicos | PASS |
| §7 Naming/routes | Ruta `?tab=suscripcion` dentro de `/admin/configuracion`; módulo y archivos kebab/PascalCase según convención | PASS |
| code-rules §10 | Tests en `modules/subscription/tests/`; sin tests inline | PASS |

Sin violaciones que requieran `Complexity Tracking`.

**Post-design re-check (Phase 1)**: PASS — la pestaña reutiliza el hub existente, el módulo respeta la capa de datos canónica, los datos sensibles vienen de la API y los errores de pago se integran en el clasificador existente.

## Project Structure

### Documentation (this feature)

```text
specs/book/025-subscription-checkout/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── subscription-ui.contract.md
│   └── billing-instructions.contract.md
├── quickstart.md
├── checklists/requirements.md
└── spec.md
```

### Source Code (repository root)

```text
apps/book/src/
├── modules/configuration/
│   ├── ConfigurationView.tsx                  # + pestaña 'suscripcion'
│   └── tests/ConfigurationView.test.tsx       # si se añade cobertura de tabs
├── modules/subscription/
│   ├── SubscriptionView.tsx                   # vista de la pestaña
│   ├── subscription.graphql                   # MySubscription, MyPaymentTransactions, mutaciones y BillingInstructions
│   ├── services.ts                            # Zod + mapeo DTO→dominio + apiRequestAuthed
│   ├── hooks.ts                               # useSubscription, usePaymentTransactions, useCreateCheckout, useSubmitManualPayment
│   ├── components/
│   │   ├── PlanSummaryCard.tsx
│   │   ├── PlanBenefits.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── ManualPaymentForm.tsx
│   │   ├── ManualPaymentInstructions.tsx
│   │   └── PaymentHistoryList.tsx
│   ├── utils/
│   │   ├── schemas.ts                         # manualPaymentSchema
│   │   ├── types.ts                           # view models
│   │   └── format.ts                          # importes/fechas/estados
│   └── tests/
│       ├── services.test.ts
│       ├── schemas.test.ts
│       ├── SubscriptionView.test.tsx
│       └── ManualPaymentForm.test.tsx
├── shared/api/
│   ├── client.ts                              # mapear nuevos códigos de pago
│   └── error-surface.ts                       # mensajes/tratamiento de pago y plan
└── shared/types/result.ts                     # + códigos de pago y PLAN_LIMIT_REACHED

apps/api/src/modules/billing/
├── billing.resolver.ts                        # + billingInstructions (autenticado)
├── billing.service.ts                         # + getInstructions()
├── billing.types.ts                           # + BillingInstructions/ManualPaymentInstructions
└── billing.config.ts                          # + banco/cédula/teléfono/tasa desde env

apps/book/codegen.schema.gql                   # snapshot API actualizado
apps/mobile/codegen.schema.gql                 # snapshot API actualizado (sin UI nueva)
```

**Structure Decision**: La vista se implementa como módulo de dominio `subscription` y se monta como cuarta pestaña del hub `ConfigurationView` (`perfil`, `pagos`, `suscripcion`, `seguridad`). Los servicios usan `apiRequestAuthed` y documentos codegen; los hooks encapsulan TanStack Query e invalidación. La API añade una query autenticada `billingInstructions` que devuelve plan y datos manuales desde configuración del servidor. No se crea una ruta nueva.

## Complexity Tracking

> Sin violaciones que justificar.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
