# Contract: Billing Webhooks (HTTP)

**Feature**: `specs/api/023-subscription-payments` | **Date**: 2026-11-09

## Rutas

```text
POST /api/v1/billing/webhooks/paypal
POST /api/v1/billing/webhooks/binance
```

Son rutas HTTP nativas, fuera de GraphQL. No usan `@RequireAuth()`; la autenticidad se valida por firma/token del proveedor.

## Requisitos de transporte

- La app Nest debe habilitar `rawBody` para leer el cuerpo original sin reserializar.
- El controlador recibe `RawBodyRequest<Request>` y las cabeceras del proveedor.
- El cuerpo se procesa solo después de validar la firma.
- La respuesta debe ser rápida y sin filtrar secretos ni stack traces.

## PayPal

### Eventos aceptados

| Evento | Acción |
| --- | --- |
| `BILLING.SUBSCRIPTION.ACTIVATED` | Marca la transacción como completada y activa/extiende la suscripción. |
| `PAYMENT.SALE.COMPLETED` | Confirma el cobro recurrente y extiende la vigencia. |
| `BILLING.SUBSCRIPTION.PAYMENT.FAILED` | Marca `FAILED` y no concede plan. |
| `BILLING.SUBSCRIPTION.CANCELLED` / `SUSPENDED` | Registra el evento; no concede vigencia nueva. |

### Verificación

- Usar la verificación oficial de firma de PayPal con `PAYPAL_WEBHOOK_ID` y las cabeceras de transmisión.
- Si la firma no es válida → `401` y no se modifica nada.
- Buscar la transacción por `gateway=PAYPAL` + `gatewayOrderId` (suscripción/orden PayPal).
- Si no existe la transacción → registrar y responder `200` sin efectos (evita reintentos infinitos).
- Si el evento ya se procesó (`status=COMPLETED`) → responder `200` sin duplicar vigencia.

## Binance Pay

### Eventos aceptados

| Evento | Acción |
| --- | --- |
| `PAYMENT_SUCCESS` | Marca `COMPLETED` y activa/extiende. |
| `PAYMENT_FAILED` / `PAYMENT_CLOSED` | Marca `FAILED`; no concede plan. |

### Verificación

- Validar la firma/certificado oficial de Binance Pay con el secreto/clave pública configurados.
- Si la firma no es válida → `401` sin cambios.
- Buscar la transacción por `gateway=BINANCE` + `gatewayOrderId`/`merchantTradeNo`.
- Duplicados → `200` sin duplicar vigencia.

## Idempotencia

1. La transacción se localiza por `gatewayOrderId` único por gateway.
2. Solo se ejecuta la activación si la transacción no está ya `COMPLETED`.
3. El id de evento del proveedor se guarda en `metadata` para auditoría.
4. Un evento repetido o una transacción ya completada devuelve `200`.

## Códigos de respuesta

| Situación | HTTP |
| --- | --- |
| Procesado correctamente | `200` |
| Duplicado/idempotente | `200` |
| Firma inválida | `401` |
| Payload inválido | `400` |
| Error interno transitorio | `500` (el proveedor puede reintentar) |

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | API PayPal. |
| `PAYPAL_PLAN_ID` | Plan de suscripción PayPal preconfigurado. |
| `PAYPAL_WEBHOOK_ID` | Verificación de firma de webhooks. |
| `PAYPAL_API_BASE` | Sandbox/producción. |
| `BINANCE_PAY_API_KEY`, `BINANCE_PAY_API_SECRET` | API Binance Pay. |
| `BINANCE_PAY_WEBHOOK_PUBLIC_KEY` | Verificación de firma. |
| `BINANCE_PAY_API_BASE` | Sandbox/producción. |
| `BILLING_CHECKOUT_RETURN_URL`, `BILLING_CHECKOUT_CANCEL_URL` | Retorno del checkout. |
| `BILLING_ALERT_WEBHOOK_URL` | Opcional, alerta operativa. |
| `BILLING_PRO_AMOUNT_USD`, `BILLING_PRO_DURATION_DAYS` | Catálogo del plan Pro. |

## Criterios verificables

1. Firma inválida → `401` y cero cambios.
2. Evento válido nuevo → `COMPLETED` y suscripción actualizada.
3. Evento duplicado → `200` y sin segunda extensión.
4. Evento fallido → `FAILED` y sin acceso Pro.
5. Importe/moneda inconsistentes → no se activa; se registra para revisión.
