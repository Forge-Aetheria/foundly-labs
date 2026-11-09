# Research: Subscription Checkout & Plan Management

**Feature**: `specs/book/025-subscription-checkout` | **Date**: 2026-11-09

## R1. Ubicación de la vista

- **Decision**: añadir `suscripcion` como pestaña de `/admin/configuracion` (`?tab=suscripcion`), sin ruta nueva ni entrada adicional en la navegación.
- **Rationale**: el hub de configuración ya agrupa perfil, métodos de pago y seguridad; la suscripción es una configuración del negocio y evita duplicar navegación. La pestaña es enlazable desde errores de límite con `?tab=suscripcion`.
- **Alternatives considered**: ruta dedicada `/admin/suscripcion` (rechazada por el usuario); ambas (rechazada por duplicación).

## R2. Datos de plan e instrucciones manuales

- **Decision**: añadir a la API una query autenticada `billingInstructions` que devuelve `plan { amount, currency, durationDays }` y `manual { bank, cedula, phone, rateVesPerUsd, note }` desde configuración del servidor. Book la consume para mostrar el checkout y los datos de Pago Móvil/Transferencia.
- **Rationale**: el usuario eligió que los datos vengan de la API; es la única forma de no hardcodear precios/tasas y de actualizar los datos bancarios sin recompilar el frontend.
- **Alternatives considered**: variables `VITE_*` en Book (rechazado por desactualización y duplicación); no mostrar datos (rechazado por el alcance).

## R3. Capa de datos del módulo

- **Decision**: crear `apps/book/src/modules/subscription/` con `services.ts` (Zod + mapeo + `apiRequestAuthed`), `hooks.ts` (TanStack Query), `subscription.graphql` (documentos codegen), componentes, utils y tests. La UI no llama a la API directamente.
- **Rationale**: cumple §5.VI y el patrón validado de módulos como `notifications`, `profile` y `configuration`.
- **Alternatives considered**: lógica en `ConfigurationView` (rechazado: UI acoplada a la API); reutilizar `configuration` (rechazado: módulo demasiado grande y semántica distinta).

## R4. Checkout PayPal/Binance y retorno

- **Decision**: las mutaciones devuelven `checkoutUrl`; Book redirige con `window.location.assign`. La API configura el return URL a `/admin/configuracion?tab=suscripcion&checkout=return`. Al montar la pestaña con `checkout=return`, se invalidan y refrescan `mySubscription`/`myPaymentTransactions` y se muestra un aviso de estado pendiente.
- **Rationale**: es el flujo estándar de redirección de proveedores y evita popups/bloqueos. El estado real lo confirma el webhook; la UI no asume éxito.
- **Alternatives considered**: popup (rechazado por bloqueadores y accesibilidad); polling agresivo (rechazado; se usa refresco al volver y un botón de actualizar).

## R5. Formulario manual

- **Decision**: `manualPaymentSchema` valida gateway (`PAGO_MOVIL`/`TRANSFERENCIA`), referencia, banco, monto positivo, moneda (`USD`/`VES`) y teléfono. El envío usa `submitManualPayment`; una referencia duplicada se mapea a error inline del campo `referenceNumber`.
- **Rationale**: evita llamadas inválidas y da feedback accionable; coincide con las validaciones de la API.
- **Alternatives considered**: validación solo en servidor (rechazado: peor UX); permitir cualquier moneda (rechazado: API solo acepta USD/VES).

## R6. Estados y errores

- **Decision**: ampliar `ErrorCode` de Book con `PLAN_LIMIT_REACHED`, `PAYMENT_PROVIDER_ERROR`, `PAYMENT_NOT_PENDING`, `PAYMENT_DUPLICATE_REFERENCE` y `PAYMENT_AMOUNT_MISMATCH`; mapearlos en `client.mapErrorCode` y `error-surface`. `PLAN_LIMIT_REACHED` muestra un enlace a la pestaña de suscripción; los errores de proveedor son transitorios/reintentables; la referencia duplicada es inline.
- **Rationale**: hoy esos códigos se convierten en `STATE_ERROR` genérico y pierden acción. La vista necesita distinguirlos.
- **Alternatives considered**: manejar strings sin ampliar el tipo (rechazado: frágil); mostrar texto crudo de la API (rechazado).

## R7. Historial y paginación

- **Decision**: `myPaymentTransactions(limit, offset)` con tamaño de página 10/20, orden descendente y botón “Cargar más” o paginación simple. Cada fila muestra gateway, estado, importe, moneda, referencia/fecha y vencimiento si aplica.
- **Rationale**: el historial puede crecer; la API ya limita a 100 y pagina. Evita descargar todo.
- **Alternatives considered**: cargar todas las transacciones (rechazado); scroll infinito (más complejo para v1).

## R8. Accesibilidad y diseño

- **Decision**: tabs accesibles del hub existente, labels explícitos, botones con estado `disabled` durante envío, mensajes en `role="status"`/`alert`, foco visible y uso de `@foundly/ui`/tokens. Sin colores mágicos.
- **Rationale**: cumple §6 y las expectativas del design system.
- **Alternatives considered**: componentes MUI directos sin tokens (rechazado).

## R9. Precios no ratificados

- **Decision**: Book muestra importe/duración/tasa solo si `billingInstructions` los devuelve; si la query falla o no están configurados, muestra “No disponible” y deshabilita el checkout, sin inventar cifras.
- **Rationale**: `specs/business-model.md` mantiene precios `TBD`; la UI no puede publicar precios no ratificados.
- **Alternatives considered**: hardcodear un precio de ejemplo (rechazado por gobernanza); ocultar el plan (rechazado: el usuario necesita contexto).

## R10. Dependencia de API

- **Decision**: la query `billingInstructions` se añade a `apps/api/src/modules/billing` como dependencia de esta feature. Reutiliza `BillingConfig` y no cambia el esquema.
- **Rationale**: es la fuente server-side elegida y mantiene el contrato de Book sin secretos.
- **Alternatives considered**: nueva spec de API separada (rechazado: es una extensión pequeña y ya acordada); datos estáticos en Book (rechazado).
