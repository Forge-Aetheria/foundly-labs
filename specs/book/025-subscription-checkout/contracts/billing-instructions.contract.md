# Contract: Billing Instructions Query (API dependency)

**Feature**: `specs/book/025-subscription-checkout` | **Date**: 2026-11-09

## Objetivo

Exponer a Book los datos server-side que la pestaña de suscripción necesita para el checkout: importe/duración del plan y datos bancarios/tasa para pagos manuales. Evita hardcodear precios o datos en el frontend.

## Operación GraphQL

```graphql
type BillingPlanInstructions {
  amount: String!
  currency: String!
  durationDays: Int!
}

type ManualPaymentInstructions {
  bank: String!
  cedula: String!
  phone: String!
  rateVesPerUsd: String!
  note: String
}

type BillingInstructions {
  plan: BillingPlanInstructions!
  manual: ManualPaymentInstructions!
}

extend type Query {
  billingInstructions: BillingInstructions!
}
```

## Seguridad

- Requiere `@RequireAuth()` + `@AllowInactiveTenant()`.
- Devuelve solo datos públicos de cobro; no incluye secretos de PayPal/Binance.
- Los valores salen de `BillingConfig` (variables de entorno del servidor).
- Si faltan datos de configuración → `STATE_ERROR`; Book muestra “No disponible”.

## Variables de entorno de API

| Variable | Uso |
| --- | --- |
| `BILLING_PRO_AMOUNT_USD` | Importe del plan Pro. |
| `BILLING_PRO_DURATION_DAYS` | Duración del plan. |
| `BILLING_MANUAL_BANK` | Banco receptor. |
| `BILLING_MANUAL_CEDULA` | Cédula/RIF receptor. |
| `BILLING_MANUAL_PHONE` | Teléfono receptor. |
| `BILLING_MANUAL_RATE_VES_PER_USD` | Tasa de referencia. |
| `BILLING_MANUAL_NOTE` | Nota opcional. |

## Criterios verificables

1. Un usuario autenticado recibe plan e instrucciones.
2. Un usuario anónimo recibe `UNAUTHENTICATED`.
3. Un tenant suspendido puede consultar las instrucciones (renovación).
4. Si falta configuración, la API devuelve `STATE_ERROR` y no inventa valores.
5. La query no expone secretos de pasarelas.
