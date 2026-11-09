# Quickstart & Validation Guide

**Feature**: `specs/api/023-subscription-payments` | **Date**: 2026-11-09

## Prerequisites

- Node.js 20+, pnpm y dependencias instaladas.
- `apps/api/.env` con `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_AUTH_URL`.
- Variables de billing configuradas (ver `contracts/billing-webhooks.contract.md`).
- Un tenant de prueba con usuario vinculado y un usuario Super Admin (`platform_role=super_admin` o `PLATFORM_ADMIN_EMAILS`).

## 1. Migración y Prisma

```bash
corepack pnpm --filter @foundly/database db:generate
corepack pnpm --filter @foundly/database db:migrate
```

Resultado esperado:
- Existen `PaymentGateway`, `PaymentStatus` y `PaymentTransaction`.
- `SubscriptionStatus` conserva sus valores actuales.
- `Tenant` tiene la relación `paymentTransactions`.

## 2. Tests automáticos

```bash
corepack pnpm --filter @foundly/api typecheck
corepack pnpm --filter @foundly/api lint
corepack pnpm --filter @foundly/api test
corepack pnpm --filter @foundly/api build
```

Resultado esperado: billing service, store, providers y webhooks en verde; sin regresiones en suscripción, catálogo, notificaciones ni auth.

## 3. Pago manual y aprobación

Con un token de un tenant Free:

```graphql
mutation Submit {
  submitManualPayment(input: {
    gateway: PAGO_MOVIL
    referenceNumber: "123456789"
    bank: "Banesco"
    amount: "29.99"
    currency: "USD"
    phone: "+58 412 000 0000"
  }) {
    id
    status
    referenceNumber
    amount
    currency
  }
}
```

Resultado esperado:
- `status = PENDING_APPROVAL`.
- `mySubscription` sigue mostrando el plan anterior.
- El log estructurado/alerta operativa incluye transacción, tenant, referencia, importe y moneda.

Con un token Super Admin:

```graphql
mutation Approve {
  approveManualPayment(transactionId: "<id>") {
    id
    status
    expiresAt
  }
}
```

Resultado esperado:
- `status = COMPLETED`.
- `Tenant.subscriptionPlan = PRO`.
- `subscriptionStatus = active`.
- `subscriptionExpiresAt` actualizado.
- Repetir la mutación no añade vigencia.

## 4. PayPal / Binance

Con un tenant autenticado:

```graphql
mutation Paypal {
  createPaypalSubscriptionOrder {
    transactionId
    gateway
    checkoutUrl
    token
    gatewayOrderId
  }
}
```

```graphql
mutation Binance {
  createBinancePaymentOrder {
    transactionId
    gateway
    checkoutUrl
    gatewayOrderId
  }
}
```

Resultado esperado: transacción `PENDING` y URL/token de checkout. Con credenciales de sandbox, completar el pago en el proveedor.

## 5. Webhooks

Simular un webhook válido con la firma correspondiente (o usar el provider fake en tests):

```bash
curl -X POST http://localhost:3002/api/v1/billing/webhooks/binance \
  -H "Content-Type: application/json" \
  -H "BinancePay-Timestamp: ..." \
  -H "BinancePay-Nonce: ..." \
  -H "BinancePay-Signature: ..." \
  --data @payload.json
```

Validar:

1. Firma inválida → `401`, sin cambios.
2. Evento válido → `200`, transacción `COMPLETED`, suscripción extendida.
3. Reenvío del mismo evento → `200`, sin segunda extensión.
4. Evento fallido → `PAYMENT_FAILED`/`FAILED`, sin acceso Pro.

## 6. Aislamiento y permisos

- Un tenant B no puede ver ni aprobar transacciones de A.
- Un usuario no Super Admin recibe `FORBIDDEN` en `approveManualPayment`.
- Un tenant suspendido puede iniciar/renovar un pago; el pago no cambia `Tenant.status`.
- Un pago `PENDING_APPROVAL`/`FAILED` no concede Pro.

## 7. Gates finales

```bash
corepack pnpm --filter @foundly/api typecheck
corepack pnpm --filter @foundly/api lint
corepack pnpm --filter @foundly/api test
corepack pnpm --filter @foundly/api build
```

Resultado esperado: todo en verde, sin referencias a precios no ratificados ni secretos en el bundle.
