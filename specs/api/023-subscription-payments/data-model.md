# Data Model: Subscription Payments & Billing

**Feature**: `specs/api/023-subscription-payments` | **Date**: 2026-11-09

## 1. Enums nuevos

### `PaymentGateway`

```text
PAYPAL
BINANCE
PAGO_MOVIL
TRANSFERENCIA
```

### `PaymentStatus`

```text
PENDING            # orden automatizada esperando confirmación del proveedor
PENDING_APPROVAL   # pago manual esperando revisión del operador
COMPLETED          # pago confirmado/aprobado; concede o extiende la suscripción
REJECTED           # pago manual rechazado por el operador
FAILED             # pago fallido o confirmación inválida del proveedor
```

`SubscriptionStatus` existente (`active`, `past_due`, `expired`, `canceled`) **no se modifica**.

## 2. Modelo `PaymentTransaction`

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `id` | `String` (cuid) | PK. |
| `tenantId` | `String` | FK a `Tenant`; `onDelete: Cascade`. |
| `plan` | `SubscriptionPlan` | Plan comprado; por defecto `PRO`. |
| `gateway` | `PaymentGateway` | Proveedor del pago. |
| `status` | `PaymentStatus` | Estado del pago; por defecto `PENDING` (automatizado) o `PENDING_APPROVAL` (manual). |
| `amount` | `Decimal @db.Decimal(12,2)` | Importe exacto; nunca `Float`. |
| `currency` | `String` | `USD` o `VES`; validado en servicio. |
| `gatewayOrderId` | `String?` | ID de orden/suscripción PayPal o Binance; único por gateway. |
| `referenceNumber` | `String?` | Referencia de Pago Móvil/Transferencia. |
| `metadata` | `Json?` | Banco, teléfono, payload del proveedor, motivo de revisión, event id, etc. |
| `expiresAt` | `DateTime?` | Fin de suscripción que otorga la transacción al completarse. |
| `paidAt` | `DateTime?` | Momento de confirmación/aprobación. |
| `reviewedBy` | `String?` | `sub` del Super Admin que aprobó un pago manual. |
| `reviewedAt` | `DateTime?` | Fecha de aprobación/rechazo manual. |
| `createdAt` | `DateTime` | Default now. |
| `updatedAt` | `DateTime` | `@updatedAt`. |

### Índices y restricciones

- `@@index([tenantId, createdAt])`
- `@@index([status])`
- `@@index([gateway, referenceNumber])`
- `@@unique([gateway, gatewayOrderId])` — los `NULL` múltiples son válidos en PostgreSQL.
- Relación `Tenant.paymentTransactions PaymentTransaction[]`.

## 3. Relaciones

```text
Tenant 1 ─── * PaymentTransaction
```

El plan efectivo sigue viviendo en `Tenant.subscriptionPlan`, `Tenant.subscriptionStatus` y `Tenant.subscriptionExpiresAt`. `PaymentTransaction` es el historial auditable de cómo se llegó a ese estado.

## 4. Transiciones de estado

```text
Automatizado (PayPal/Binance)
  create order ──► PENDING
  webhook success ──► COMPLETED
  webhook failure ──► FAILED
  webhook duplicado sobre COMPLETED ──► no-op (200)

Manual (Pago Móvil/Transferencia)
  submit ──► PENDING_APPROVAL
  approve ──► COMPLETED
  reject ──► REJECTED
  approve sobre COMPLETED ──► no-op idempotente
  approve sobre REJECTED/FAILED ──► PAYMENT_NOT_PENDING
```

`COMPLETED`, `REJECTED` y `FAILED` son estados terminales para la concesión de vigencia. Solo `COMPLETED` actualiza la suscripción.

## 5. Regla de activación/extensión

Al pasar a `COMPLETED`:

```text
base = max(now, tenant.subscriptionExpiresAt ?? now)
newExpiry = base + durationDays
```

Luego se actualiza atómicamente:

- `PaymentTransaction.status = COMPLETED`
- `PaymentTransaction.paidAt = now`
- `PaymentTransaction.expiresAt = newExpiry`
- `Tenant.subscriptionPlan = PRO`
- `Tenant.subscriptionStatus = active`
- `Tenant.subscriptionExpiresAt = newExpiry`

Si `durationDays` o el importe del plan no están configurados, la operación falla con `STATE_ERROR` antes de crear la orden.

## 6. Validaciones de entrada

| Campo | Regla |
| --- | --- |
| `referenceNumber` | Requerido en manual; no vacío; recortado; indexado. |
| `bank` | Requerido en manual; no vacío. |
| `phone` | Requerido en manual; formato razonable; guardado en metadata. |
| `amount` | Manual: número positivo; automatizado: lo fija el servidor. |
| `currency` | `USD` o `VES`; manual puede ser VES; automatizado USD. |
| `gateway` | Manual solo `PAGO_MOVIL`/`TRANSFERENCIA`; automatizado solo `PAYPAL`/`BINANCE`. |
| `tenantId` | Siempre derivado del JWT en operaciones de cliente. |

## 7. Datos que no se persisten

- Secretos de PayPal/Binance.
- Número completo de tarjeta o credenciales financieras.
- Tokens de acceso de proveedores.
- Teléfono completo en logs estructurados; puede ir en `metadata` para auditoría operativa.

## 8. Migración

Nueva migración `add_subscription_payments`:

- `CREATE TYPE "PaymentGateway"`.
- `CREATE TYPE "PaymentStatus"`.
- `CREATE TABLE "PaymentTransaction"` con FK a `Tenant` y `ON DELETE CASCADE`.
- Índices y unique compuesto.
- Sin backfill: las filas existentes no se tocan.
- `prisma generate` y sincronización de snapshots SDL de Book/Mobile.
