# Contract: Payment Provider Seam

**Feature**: `specs/api/023-subscription-payments` | **Date**: 2026-11-09

## Objetivo

Aislar PayPal y Binance Pay detrás de una interfaz común para que el dominio de billing no dependa de SDKs, formatos de payload ni detalles de firma.

## Interfaz conceptual

```text
PaymentProvider
├── createCheckout(input): Promise<CheckoutResult>
└── verifyWebhook(rawBody, headers): Promise<WebhookEvent>
```

### `createCheckout`

Entrada:

- `transactionId`
- `tenantId`
- `amount`
- `currency`
- `plan`
- `returnUrl`
- `cancelUrl`

Salida:

- `gatewayOrderId`
- `checkoutUrl` o `token`
- `providerMetadata` (solo datos no sensibles)

Reglas:

- El importe y la duración los fija el servidor.
- Un fallo del proveedor se traduce a `PAYMENT_PROVIDER_ERROR`.
- Timeout acotado y sin reintentos automáticos dentro de la petición del cliente.
- No se registran secretos ni payloads completos.

### `verifyWebhook`

Entrada:

- cuerpo original (`rawBody`)
- cabeceras del proveedor

Salida:

- `eventId`
- `eventType`
- `gatewayOrderId`
- `status` (`COMPLETED` | `FAILED` | `IGNORED`)
- `amount` / `currency` si están disponibles
- `metadata` saneada

Reglas:

- Firma inválida → error de autenticidad; el controlador responde `401`.
- Evento no soportado → `IGNORED`, respuesta `200`.
- Nunca se confía en un tenant/importe enviado por el cliente para decidir la activación.

## Implementaciones

| Proveedor | Creación | Verificación |
| --- | --- | --- |
| PayPal | Subscriptions API con `PAYPAL_PLAN_ID` | Verificación oficial de firma con `PAYPAL_WEBHOOK_ID`. |
| Binance Pay | Crear orden con `merchantTradeNo` | Firma/certificado oficial de Binance Pay. |
| Pago Móvil / Transferencia | No aplica (manual) | No aplica; aprobación por Super Admin. |

## Pruebas

- Providers falsos inyectados en `BillingService`.
- Test de firma inválida sin llamadas a base de datos.
- Test de evento duplicado sin segunda activación.
- Test de timeout/error de proveedor → `PAYMENT_PROVIDER_ERROR`.
