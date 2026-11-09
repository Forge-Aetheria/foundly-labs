# Data Model: Subscription Checkout & Plan Management

**Feature**: `specs/book/025-subscription-checkout` | **Date**: 2026-11-09

No hay persistencia nueva en Book. El estado vive en TanStack Query y en la sesión Supabase; los pagos y la suscripción son propiedad de la API.

## 1. `SubscriptionSummary` (view model)

Origen: query `mySubscription`.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `plan` | `FREE \| PRO` | Plan contratado; desconocido → Free. |
| `effectivePlan` | `FREE \| PRO` | Plan aplicable tras estado/vencimiento. |
| `status` | `active \| past_due \| expired \| canceled` | Estado de suscripción de la API. |
| `expiresAt` | `string \| null` | ISO-8601. |
| `limits.services` | `{ used, limit, unlimited }` | Uso de servicios activos. |
| `limits.team` | `{ used, limit, unlimited }` | Uso de equipo activo. |

## 2. `BillingInstructions` (view model)

Origen: nueva query `billingInstructions` de la API.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `plan.amount` | `string` | Decimal serializado; solo si está configurado. |
| `plan.currency` | `string` | `USD` por ahora. |
| `plan.durationDays` | `number` | Entero positivo. |
| `manual.bank` | `string` | Banco receptor de la plataforma. |
| `manual.cedula` | `string` | Cédula/RIF receptor. |
| `manual.phone` | `string` | Teléfono receptor. |
| `manual.rateVesPerUsd` | `string` | Tasa de referencia; no se calcula en cliente. |
| `manual.note` | `string \| null` | Instrucción adicional. |

Si la query no responde o faltan datos, la vista muestra “No disponible” y deshabilita las acciones que dependan de esos datos. No hay fallback hardcodeado.

## 3. `PaymentTransactionView`

Origen: query `myPaymentTransactions`.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `string` | Identificador. |
| `gateway` | `PAYPAL \| BINANCE \| PAGO_MOVIL \| TRANSFERENCIA` | Método. |
| `status` | `PENDING \| PENDING_APPROVAL \| COMPLETED \| REJECTED \| FAILED` | Estado. |
| `amount` | `string` | Decimal serializado. |
| `currency` | `string` | `USD`/`VES`. |
| `referenceNumber` | `string \| null` | Referencia manual. |
| `expiresAt` | `string \| null` | Vencimiento otorgado si está completada. |
| `createdAt` | `string` | Fecha de creación. |
| `updatedAt` | `string` | Última actualización. |

## 4. `ManualPaymentDraft`

| Campo | Tipo | Validación |
| --- | --- | --- |
| `gateway` | `PAGO_MOVIL \| TRANSFERENCIA` | Requerido; no automatizado. |
| `referenceNumber` | `string` | Requerido; no vacío; trim. |
| `bank` | `string` | Requerido; no vacío. |
| `amount` | `string` | Decimal positivo; se envía como string. |
| `currency` | `USD \| VES` | Requerido; cerrado. |
| `phone` | `string` | Requerido; formato razonable. |

## 5. Claves de caché

| Clave | Contenido |
| --- | --- |
| `['subscription', tenantId]` | `mySubscription` |
| `['billing-instructions']` | `billingInstructions` |
| `['payment-transactions', tenantId, limit, offset]` | Historial |

Todas las claves de datos del tenant incluyen `tenantId` para no mezclar sesiones.

## 6. Estados de la vista

```text
loading ──► ready
loading ──► error (API/sesión/config)
ready ──► checkout-redirect (PayPal/Binance)
ready ──► manual-submitting ──► manual-pending
ready ──► manual-error
pending ──► ready (tras confirmación/refresco)
```

- `loading`: skeleton.
- `error`: mensaje accionable y reintento.
- `checkout-redirect`: deshabilita acciones y redirige.
- `manual-submitting`: botón deshabilitado y `aria-busy`.
- `manual-pending`: transacción creada, plan visible sin cambios.
- Tras `checkout=return` o refresco manual se invalidan las queries.

## 7. Reglas de presentación

- `effectivePlan` es lo que se muestra como plan actual; `plan` puede diferir si está vencido.
- Vencimiento vacío → “Sin fecha de vencimiento” solo si el plan es Free; Pro sin fecha debe interpretarse como vigente según la API.
- Un pago `PENDING`/`PENDING_APPROVAL` nunca se presenta como plan activo.
- Importes siempre formateados desde string; nunca se recalculan tasas en cliente.
- Estados de pago traducidos a etiquetas en español y tonos semánticos del design system.
