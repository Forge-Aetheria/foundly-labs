# Contract: Billing GraphQL Surface

**Feature**: `specs/api/023-subscription-payments` | **Date**: 2026-11-09

## Autenticación y alcance

- Operaciones de cliente: `@RequireAuth()` + `@AllowInactiveTenant()`.
- `approveManualPayment`: `@RequireSuperAdmin()`.
- El `tenantId` sale siempre de `AuthUser.tenantId`; nunca de un argumento.
- Un tenant suspendido puede iniciar/renovar un pago; el pago no cambia `Tenant.status`.

## Tipos

```graphql
enum PaymentGateway {
  PAYPAL
  BINANCE
  PAGO_MOVIL
  TRANSFERENCIA
}

enum PaymentStatus {
  PENDING
  PENDING_APPROVAL
  COMPLETED
  REJECTED
  FAILED
}

type CheckoutSession {
  transactionId: ID!
  gateway: PaymentGateway!
  checkoutUrl: String
  token: String
  gatewayOrderId: String
}

type PaymentTransaction {
  id: ID!
  gateway: PaymentGateway!
  status: PaymentStatus!
  plan: SubscriptionPlan!
  amount: String!
  currency: String!
  gatewayOrderId: String
  referenceNumber: String
  expiresAt: String
  createdAt: String!
  updatedAt: String!
}

input SubmitManualPaymentInput {
  gateway: PaymentGateway!   # PAGO_MOVIL | TRANSFERENCIA
  referenceNumber: String!
  bank: String!
  amount: String!
  currency: String!          # USD | VES
  phone: String!
}
```

`amount` se expone como `String` para conservar la precisión del `Decimal`.

## Mutaciones

### `createPaypalSubscriptionOrder: CheckoutSession!`

- Crea una transacción `PENDING` con `gateway=PAYPAL`, importe/plan del servidor.
- Llama a PayPal Subscriptions y guarda `gatewayOrderId` (suscripción PayPal).
- Devuelve `checkoutUrl` de aprobación.
- Errores: `UNAUTHENTICATED`, `STATE_ERROR` (config/plan faltante), `PAYMENT_PROVIDER_ERROR`.

### `createBinancePaymentOrder: CheckoutSession!`

- Crea una transacción `PENDING` con `gateway=BINANCE`.
- Crea la orden Binance Pay y guarda `gatewayOrderId`/`merchantTradeNo`.
- Devuelve la URL de pago.
- Errores: los mismos que PayPal.

### `submitManualPayment(input: SubmitManualPaymentInput!): PaymentTransaction!`

- Solo acepta `PAGO_MOVIL` o `TRANSFERENCIA`.
- Crea una transacción `PENDING_APPROVAL`.
- Guarda en `metadata`: banco, teléfono, usuario/origen y datos de auditoría.
- Dispara la alerta operativa.
- No modifica el plan ni el vencimiento.
- Errores: `UNAUTHENTICATED`, `VALIDATION_ERROR`, `PAYMENT_DUPLICATE_REFERENCE`.

### `approveManualPayment(transactionId: ID!): PaymentTransaction!`

- Solo Super Admin.
- Solo transacciones manuales en `PENDING_APPROVAL`.
- Marca `COMPLETED`, calcula la nueva vigencia y actualiza el tenant atómicamente.
- Si ya está `COMPLETED`, devuelve la transacción sin añadir vigencia (idempotente).
- Si está `REJECTED`/`FAILED`, devuelve `PAYMENT_NOT_PENDING`.
- Errores: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `PAYMENT_NOT_PENDING`.

## Query

### `myPaymentTransactions(limit: Int, offset: Int): [PaymentTransaction!]!`

- Devuelve las transacciones del tenant autenticado, más recientes primero.
- Límite por defecto 20, máximo 100; paginación validada.
- No expone transacciones de otros tenants.

## Códigos de error de billing

| Código | Uso |
| --- | --- |
| `PAYMENT_PROVIDER_ERROR` | Fallo de comunicación/creación con PayPal o Binance. |
| `PAYMENT_NOT_PENDING` | Se intenta aprobar una transacción no pendiente. |
| `PAYMENT_DUPLICATE_REFERENCE` | Referencia manual duplicada para el mismo gateway/tenant. |
| `PAYMENT_AMOUNT_MISMATCH` | Confirmación del proveedor no coincide con la transacción. |
| `STATE_ERROR` | Configuración de plan/proveedor incompleta. |

Estos códigos deben añadirse a la allowlist del normalizador de errores (`apps/api/src/graphql/errors.ts`).

## Criterios verificables

1. Crear una orden PayPal/Binance devuelve checkout y una transacción `PENDING`.
2. `submitManualPayment` devuelve `PENDING_APPROVAL` y no cambia `mySubscription`.
3. `approveManualPayment` como Super Admin activa/extiende; repetirlo no duplica.
4. Un usuario normal no puede aprobar.
5. Un tenant no ve transacciones de otro.
6. Los importes vienen del servidor; el cliente no puede imponer plan/duración.
