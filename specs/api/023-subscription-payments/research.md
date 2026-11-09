# Research: Subscription Payments & Billing

**Feature**: `specs/api/023-subscription-payments` | **Date**: 2026-11-09

## R1. Separación de estados y enums

- **Decision**: crear `PaymentGateway` (`PAYPAL`, `BINANCE`, `PAGO_MOVIL`, `TRANSFERENCIA`) y `PaymentStatus` (`PENDING`, `PENDING_APPROVAL`, `COMPLETED`, `REJECTED`, `FAILED`). No se modifica `SubscriptionStatus`. `PENDING` representa una orden automatizada esperando confirmación del proveedor; `PENDING_APPROVAL` queda reservado al flujo manual.
- **Rationale**: evita una migración incompatible del enum existente y distingue el ciclo de vida del pago del ciclo de vida de la suscripción. `PENDING` es necesario para no etiquetar como “aprobación manual” una orden de PayPal/Binance.
- **Alternatives considered**: reutilizar `PENDING_APPROVAL` para todo (rechazado por semántica confusa); reemplazar `SubscriptionStatus` (rechazado por ruptura de `SubscriptionGuard` y datos existentes).

## R2. Representación del importe

- **Decision**: `amount Decimal @db.Decimal(12,2)` y `currency String` (`USD`/`VES`). En GraphQL se expone `amount` como `String` serializado para no perder precisión.
- **Rationale**: el dinero no debe viajar como `Float`; la serialización como string mantiene exactitud y evita introducir un scalar Decimal nuevo.
- **Alternatives considered**: `Float` (rechazado por precisión); `amountCents Int` (correcto pero se aleja del modelo solicitado y complica la UI multi-moneda).

## R3. PayPal: Subscriptions API

- **Decision**: usar PayPal Subscriptions API con un `PAYPAL_PLAN_ID` configurado por entorno. `createPaypalSubscriptionOrder` crea una suscripción y devuelve el enlace de aprobación. Los webhooks relevantes son `BILLING.SUBSCRIPTION.ACTIVATED`, `PAYMENT.SALE.COMPLETED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED` y eventos de cancelación/suspensión.
- **Rationale**: el modelo de negocio es una suscripción recurrente; PayPal Subscriptions gestiona el ciclo recurrente y evita capturas manuales de Orders.
- **Alternatives considered**: Orders API con captura manual (rechazado: no es recurrente y exige un paso extra no especificado); SDK oficial (rechazado: `fetch` nativo evita una dependencia).

## R4. Binance Pay

- **Decision**: crear una orden con Binance Pay (`merchantTradeNo`, importe, moneda y descripción) y devolver la URL de checkout. El webhook se valida con la firma/certificado oficial de Binance Pay configurado por entorno.
- **Rationale**: es el flujo estándar de Binance Pay y permite confirmación automática sin intervención.
- **Alternatives considered**: Binance Pay SDK (rechazado: dependencia innecesaria); polling de estado (rechazado: menos fiable y más costoso).

## R5. Webhooks: raw body, firma e idempotencia

- **Decision**: habilitar `rawBody` en la app Nest, exponer `POST /api/v1/billing/webhooks/paypal` y `POST /api/v1/billing/webhooks/binance` en un controlador dedicado, verificar firma/token antes de procesar y responder `200` en duplicados/ignorados. La idempotencia primaria es `PaymentTransaction.gatewayOrderId` + estado `COMPLETED`; el id de evento se registra en metadata para auditoría.
- **Rationale**: PayPal/Binance firman el cuerpo original; sin raw body la verificación no es fiable. Procesar dos veces el mismo evento no debe extender la suscripción dos veces.
- **Alternatives considered**: webhooks GraphQL (rechazado: los proveedores requieren HTTP nativo); idempotencia solo por event id (insuficiente si el proveedor reintenta con otro id).

## R6. Activación y extensión de la suscripción

- **Decision**: al completar un pago, una transacción Prisma atómica actualiza `PaymentTransaction.status=COMPLETED`, fija `paidAt`, calcula `expiresAt = max(now, tenant.subscriptionExpiresAt ?? now) + durationDays`, y actualiza `Tenant.subscriptionPlan=PRO`, `subscriptionStatus=active`, `subscriptionExpiresAt=expiresAt`.
- **Rationale**: una renovación extiende la vigencia existente en lugar de perder días; el pago y la suscripción deben cambiar juntos o no cambiar.
- **Alternatives considered**: extender siempre desde `now` (rechazado: penaliza renovaciones anticipadas); actualizar tenant y transacción en pasos separados (rechazado: riesgo de inconsistencia).

## R7. Aprobación manual

- **Decision**: `approveManualPayment` es una mutación GraphQL protegida con `@RequireSuperAdmin()`, solo acepta transacciones `PAGO_MOVIL`/`TRANSFERENCIA` en `PENDING_APPROVAL`, y usa la misma rutina atómica de activación. Si ya está `COMPLETED`, devuelve la transacción sin añadir vigencia. Si está `REJECTED`/`FAILED`, rechaza la aprobación.
- **Rationale**: la aprobación es la autoridad final del pago manual y debe ser idempotente y auditable.
- **Alternatives considered**: aprobación por email/token (rechazado: fuera del modelo de identidad actual); aprobación automática por importe (rechazado: no hay tasa/validación bancaria fiable).

## R8. Catálogo de plan y precios

- **Decision**: el importe, moneda y duración del plan Pro se leen de configuración del servidor (`BILLING_PRO_AMOUNT_USD`, `BILLING_PRO_DURATION_DAYS`). Si faltan, las operaciones de cobro fallan con `STATE_ERROR`; no se inventan precios. El cliente nunca decide el importe ni la duración que se concede.
- **Rationale**: `specs/business-model.md` mantiene los precios como `TBD`; hardcodearlos violaría la gobernanza. El servidor debe ser la autoridad del plan vendido.
- **Alternatives considered**: precios hardcodeados (rechazado); aceptar importe/duración del cliente (rechazado por seguridad).

## R9. Pagos manuales en bolívares

- **Decision**: `submitManualPayment` registra `amount`, `currency` (`USD`/`VES`), `bank`, `phone` y `referenceNumber` en metadata, crea `PENDING_APPROVAL` y emite una alerta estructurada. La aprobación no depende de una tasa automática; el operador audita el importe/referencia.
- **Rationale**: no hay una fuente de tasa USD/VES ratificada ni conciliación bancaria automatizada; la revisión humana es el control real.
- **Alternatives considered**: convertir automáticamente con una tasa externa (rechazado: dependencia y riesgo no definidos); aceptar cualquier importe como pago válido (rechazado).

## R10. Alertas operativas

- **Decision**: `ManualPaymentNotifier` emite un log estructurado (`event: manual_payment_pending`) con transacción, tenant, referencia, importe, moneda y gateway; opcionalmente hace `POST` a `BILLING_ALERT_WEBHOOK_URL` (Telegram u otro webhook) si está configurado. No se registran secretos ni teléfono completo en logs.
- **Rationale**: cumple la alerta operativa sin acoplar el dominio a un bot concreto y mantiene la redacción de PII del logger.
- **Alternatives considered**: integración directa con Telegram (rechazada: acoplamiento prematuro); solo log (aceptable, pero se ofrece el webhook opcional).

## R11. Tenant suspendido y renovación

- **Decision**: las mutaciones de billing usan `@RequireAuth()` + `@AllowInactiveTenant()` para que un tenant suspendido/draft pueda pagar o reportar un pago. El pago actualiza la suscripción, pero no cambia `Tenant.status`; la reactivación operativa sigue siendo una decisión administrativa separada.
- **Rationale**: un negocio suspendido debe poder renovar, pero suspensión operativa y suscripción son ejes distintos.
- **Alternatives considered**: bloquear billing por completo (rechazado: impide renovar); reactivar automáticamente el tenant (rechazado: mezcla dos decisiones).

## R12. Alcance del frontend

- **Decision**: esta spec no implementa la vista de checkout de Book; solo sincroniza los snapshots SDL de Book/Mobile para que el contrato quede disponible. La UI de billing será una spec `book` posterior.
- **Rationale**: el usuario acordó dividir la feature en dos specs.
- **Alternatives considered**: incluir la UI en esta spec (rechazado por el split acordado y por el alcance de dominio).
