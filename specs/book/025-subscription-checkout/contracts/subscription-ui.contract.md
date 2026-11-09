# Contract: Subscription Tab UI

**Feature**: `specs/book/025-subscription-checkout` | **Date**: 2026-11-09

## Ruta y montaje

- URL: `/admin/configuracion?tab=suscripcion`
- `CONFIG_TABS` pasa a incluir `suscripcion`.
- La pestaña se renderiza dentro de `ConfigurationView` y respeta el montaje diferido existente.
- No se añade una ruta nueva ni una entrada de navegación principal.

## Composición

```text
SubscriptionView
├── PlanSummaryCard        # plan, effectivePlan, estado, vencimiento
├── PlanBenefits           # qué incluye Free/Pro y CTA de upgrade
├── PaymentMethodSelector  # PayPal, Binance, Pago Móvil, Transferencia
├── ManualPaymentInstructions
│   └── banco, cédula/RIF, teléfono, tasa, nota
├── ManualPaymentForm      # gateway, referencia, banco, monto, moneda, teléfono
└── PaymentHistoryList     # estados y paginación
```

## Datos y acciones

| Acción | Documento GraphQL | Resultado |
| --- | --- | --- |
| Cargar plan/uso | `MySubscription` | `SubscriptionSummary` |
| Cargar instrucciones | `BillingInstructions` | plan + datos manuales |
| Iniciar PayPal | `CreatePaypalSubscriptionOrder` | `checkoutUrl` → redirección |
| Iniciar Binance | `CreateBinancePaymentOrder` | `checkoutUrl` → redirección |
| Enviar manual | `SubmitManualPayment` | transacción `PENDING_APPROVAL` |
| Historial | `MyPaymentTransactions` | lista paginada |

Todas las operaciones usan `apiRequestAuthed`; el `tenantId` no se envía.

## Estados de UI

| Estado | Comportamiento |
| --- | --- |
| Cargando | Skeleton de tarjetas; no se muestran acciones de pago. |
| Free | Muestra límites, beneficios Pro y métodos de pago. |
| Pro | Muestra vencimiento, límites ilimitados y renovación. |
| Vencido | Muestra plan efectivo Free y aviso de vencimiento. |
| Pago pendiente | Muestra “Pendiente de aprobación/confirmación”; no activa visualmente Pro. |
| Error de instrucciones | Muestra “No disponible” y deshabilita PayPal/Binance/manual si faltan importes/datos. |
| Error de proveedor | Alerta accionable con reintento. |
| Sesión expirada | Flujo global `UNAUTHENTICATED` → login. |

## Errores mapeados

| Código API | Tratamiento |
| --- | --- |
| `UNAUTHENTICATED` | Sesión global. |
| `FORBIDDEN` | Inline/transient; no mostrar datos. |
| `VALIDATION_ERROR` | Inline por campo. |
| `PLAN_LIMIT_REACHED` | Enlace a `?tab=suscripcion` y mensaje de upgrade. |
| `PAYMENT_PROVIDER_ERROR` | Alerta transitoria con reintento. |
| `PAYMENT_DUPLICATE_REFERENCE` | Error inline en `referenceNumber`. |
| `PAYMENT_NOT_PENDING` | Alerta; el estado cambió, refrescar. |
| `PAYMENT_AMOUNT_MISMATCH` | Alerta; el pago está en revisión. |

## Reglas de interacción

- El botón de envío manual se deshabilita mientras hay una petición.
- PayPal/Binance se deshabilitan mientras se crea la orden.
- Al volver con `checkout=return`, se invalidan y refrescan las queries.
- La vista permite refrescar manualmente el estado de pago.
- No se guardan datos de pago ni referencias en `localStorage`.
- La tasa y los importes se muestran como datos de la API; no se calculan localmente.

## Accesibilidad

- Tabs con `aria-controls`/`aria-labelledby` (ya existentes).
- Labels asociados a cada campo.
- Errores anunciados con `role="alert"`; confirmaciones con `role="status"`.
- Botones con nombre accesible y estado `aria-busy` durante envío.
- Contraste y tokens del design system; sin colores mágicos.

## Criterios verificables

1. La pestaña aparece en Configuración y conserva el estado al cambiar de tab.
2. Free/Pro/vencido/pendiente muestran el plan efectivo correcto.
3. PayPal/Binance redirigen con una URL válida o muestran error.
4. Manual válido queda pendiente y no cambia el plan.
5. Referencia duplicada muestra error inline.
6. El historial muestra los cinco estados con etiquetas correctas.
7. La vista pasa `typecheck`, `lint`, `test` y `build`.
