# Feature Specification: Subscription Checkout & Plan Management

**Feature Branch**: `025-subscription-checkout`

**Created**: 2026-11-09

**Status**: Draft

**Input**: Implementar en `apps/book` la vista de suscripción y checkout dentro de `/admin/configuracion?tab=suscripcion`, con estado del plan, uso, PayPal, Binance Pay y Pago Móvil/Transferencia manual, consumiendo las operaciones de billing de la API.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el plan actual y el uso (Priority: P1)

Un dueño de negocio abre la pestaña **Suscripción** y ve su plan actual, el plan efectivo, el estado, la fecha de vencimiento y cuántos servicios y miembros de equipo activos tiene frente a los límites.

**Why this priority**: Sin visibilidad del plan, el usuario no entiende por qué se bloquean funciones ni qué obtiene al pagar.

**Independent Test**: Abrir `/admin/configuracion?tab=suscripcion` con un negocio Free y con uno Pro; comprobar plan, estado, vencimiento y uso; simular vencimiento y comprobar que se muestra Free.

**Acceptance Scenarios**:

1. **Given** un negocio Free autenticado, **When** abre la pestaña Suscripción, **Then** ve el plan Free, su estado y el uso de servicios/equipo frente a los límites.
2. **Given** un negocio Pro vigente, **When** abre la pestaña, **Then** ve Pro, la fecha de vencimiento y los límites ilimitados.
3. **Given** un Pro vencido, **When** abre la pestaña, **Then** ve el plan efectivo Free y un aviso de vencimiento.
4. **Given** un pago pendiente, **When** abre la pestaña, **Then** ve el estado pendiente y el plan anterior sigue vigente.

---

### User Story 2 - Pagar con PayPal o Binance Pay (Priority: P1)

Un dueño de negocio elige PayPal o Binance Pay, el sistema crea la orden y lo redirige al checkout del proveedor. Al volver, ve que el pago está pendiente de confirmación y, cuando el proveedor confirma, el plan se actualiza.

**Why this priority**: Es la vía automatizada principal y debe ser clara y sin estados ambiguos.

**Independent Test**: Pulsar PayPal y Binance, verificar que se crea una transacción y que la redirección usa la URL devuelta; al volver, comprobar el estado pendiente y la actualización tras confirmación.

**Acceptance Scenarios**:

1. **Given** un negocio autenticado, **When** elige PayPal, **Then** se crea una orden y se le redirige a la URL de checkout de PayPal.
2. **Given** un negocio autenticado, **When** elige Binance Pay, **Then** se crea una orden y se le redirige a la URL de pago de Binance.
3. **Given** una orden creada, **When** el usuario vuelve del proveedor, **Then** la pestaña muestra la transacción como pendiente hasta que se confirme.
4. **Given** una confirmación del proveedor, **When** el usuario refresca o vuelve a abrir la pestaña, **Then** ve el plan actualizado y el nuevo vencimiento.
5. **Given** un fallo del proveedor, **When** se intenta crear la orden, **Then** ve un mensaje accionable y no se muestra un plan activado falsamente.

---

### User Story 3 - Reportar un pago manual en bolívares (Priority: P1)

Un dueño de negocio elige Pago Móvil o Transferencia, ve los datos bancarios de la plataforma y la tasa de referencia, y envía la referencia, banco, monto, moneda y teléfono. El pago queda pendiente de aprobación.

**Why this priority**: Es el método local principal y debe ser fácil de completar sin ambigüedad.

**Independent Test**: Abrir la pestaña, ver los datos bancarios, enviar un pago manual válido y comprobar que queda pendiente, que no cambia el plan y que el formulario muestra confirmación.

**Acceptance Scenarios**:

1. **Given** la pestaña Suscripción, **When** el usuario elige Pago Móvil o Transferencia, **Then** ve banco, cédula/RIF, teléfono, tasa de referencia y los campos requeridos.
2. **Given** el formulario completo y válido, **When** envía el pago, **Then** la transacción queda pendiente de aprobación y el plan no cambia.
3. **Given** una referencia ya usada, **When** envía el formulario, **Then** ve un error inline en la referencia y no se crea otra transacción.
4. **Given** un monto o moneda inválidos, **When** envía el formulario, **Then** ve errores de validación y no se llama a la API.
5. **Given** un envío exitoso, **When** el usuario vuelve a la pestaña, **Then** ve el pago pendiente en el historial.

---

### User Story 4 - Entender el estado y el historial de pagos (Priority: P2)

El dueño de negocio ve el historial de sus transacciones y distingue claramente entre pendiente de aprobación, completado, rechazado y fallido.

**Why this priority**: Reduce la incertidumbre y las consultas de soporte sobre si el pago llegó o no.

**Independent Test**: Con transacciones en distintos estados, comprobar que cada una muestra su estado, fecha, importe, moneda y referencia/gateway correctos.

**Acceptance Scenarios**:

1. **Given** varias transacciones, **When** abre el historial, **Then** se ordenan de más reciente a más antigua.
2. **Given** una transacción pendiente, **When** la ve, **Then** se identifica como “Pendiente de aprobación”.
3. **Given** una transacción completada, **When** la ve, **Then** se identifica como “Completada” y muestra el vencimiento otorgado.
4. **Given** una transacción rechazada o fallida, **When** la ve, **Then** se identifica claramente y ofrece reintentar el pago.
5. **Given** un tenant sin transacciones, **When** abre el historial, **Then** ve un estado vacío limpio con la acción de pagar.

---

### Edge Cases

- El plan o los datos bancarios no están configurados en la API: la vista muestra un estado “no disponible”, no inventa precios ni datos.
- El usuario vuelve del checkout sin haber pagado: la transacción sigue pendiente y se ofrece reintentar.
- El webhook tarda en confirmar: la UI muestra “pendiente de confirmación” y permite refrescar sin duplicar la orden.
- El usuario cierra y reabre la app: el estado se recupera desde la API, no desde memoria local.
- El pago manual se envía dos veces por doble clic: el botón se deshabilita y el backend rechaza la referencia duplicada.
- El tenant está suspendido: puede ver y renovar su suscripción; el proceso no cambia el estado operativo del negocio.
- La sesión expira durante el checkout: se limpia la sesión y se redirige a login sin mostrar datos del tenant.
- El plan mostrado por la API es desconocido: se muestra Free de forma fail-closed.
- El usuario no tiene permiso para ver la pestaña: no se muestran datos y se le redirige según el guard.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La app MUST exponer la vista de suscripción en `/admin/configuracion?tab=suscripcion` como una pestaña del hub de configuración.
- **FR-002**: La vista MUST mostrar plan actual, plan efectivo, estado, vencimiento y uso de servicios/equipo.
- **FR-003**: La vista MUST mostrar el estado de un pago pendiente y no presentar como activo un plan que aún no fue confirmado.
- **FR-004**: La vista MUST ofrecer los métodos PayPal, Binance Pay, Pago Móvil y Transferencia.
- **FR-005**: PayPal y Binance MUST crear la orden mediante la API y redirigir al checkout devuelto por el servidor.
- **FR-006**: El retorno del checkout MUST volver a la pestaña de suscripción y refrescar el estado de las transacciones.
- **FR-007**: La vista MUST mostrar las instrucciones de pago manual (banco, cédula/RIF, teléfono y tasa de referencia) obtenidas de la API.
- **FR-008**: El formulario manual MUST incluir gateway, referencia, banco, monto, moneda y teléfono.
- **FR-009**: El formulario manual MUST validar campos obligatorios, monto positivo y moneda permitida antes de llamar a la API.
- **FR-010**: Un pago manual exitoso MUST mostrarse como pendiente de aprobación sin modificar el plan visible.
- **FR-011**: Una referencia duplicada MUST mostrarse como error inline en el campo de referencia.
- **FR-012**: La vista MUST mostrar el historial de transacciones del tenant, ordenado por fecha descendente.
- **FR-013**: El historial MUST distinguir pendiente de aprobación, completado, rechazado y fallido.
- **FR-014**: Un pago completado MUST reflejar el nuevo plan y vencimiento al refrescar.
- **FR-015**: La vista MUST manejar errores de proveedor, plan, validación y sesión con mensajes distintos y accionables.
- **FR-016**: El botón de envío MUST bloquearse durante una petición para evitar duplicados.
- **FR-017**: La vista MUST no mostrar precios, tasas ni datos bancarios inventados; si la API no los entrega, muestra un estado no disponible.
- **FR-018**: La vista MUST ser accesible por teclado, con labels, estados de carga y mensajes anunciados.
- **FR-019**: La vista MUST usar la capa de datos del módulo (`services.ts`/`hooks.ts`) y tipos codegen; los componentes no llaman directamente a la API.
- **FR-020**: Las operaciones y datos MUST estar aislados por el tenant de la sesión; nunca se acepta un identificador de negocio desde la URL.
- **FR-021**: La vista MUST ofrecer un enlace o acción de reintento cuando un pago falla o es rechazado.
- **FR-022**: La vista MUST reflejar el estado actualizado en un máximo de 30 segundos tras una confirmación o mediante acción de refresco.

### Key Entities

- **Resumen de suscripción**: plan, plan efectivo, estado, vencimiento y uso de límites.
- **Transacción de pago visible**: gateway, estado, importe, moneda, referencia, fecha y vencimiento otorgado.
- **Instrucciones de pago manual**: banco, cédula/RIF, teléfono y tasa de referencia de la plataforma.
- **Plan mostrado**: nombre/beneficios y precio solo si la API lo entrega; nunca inventado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los dueños autenticados ve su plan, estado, vencimiento y uso al abrir la pestaña.
- **SC-002**: El 100% de los pagos manuales válidos queda en estado pendiente sin activar el plan.
- **SC-003**: El 100% de las referencias duplicadas muestra un error inline y no crea una segunda transacción.
- **SC-004**: El 100% de los botones PayPal/Binance inicia el checkout con una URL válida o muestra un error accionable.
- **SC-005**: El estado del plan se actualiza tras la confirmación en un máximo de 30 segundos o con una acción de refresco.
- **SC-006**: El 100% de las transacciones del historial muestra gateway, estado, importe, moneda y fecha.
- **SC-007**: La vista pasa los gates de Book (`typecheck`, `lint`, `test`, `build`) sin regresiones.

## Governance

Esta especificación se subordina a `specs/business-model.md` (progresión Free/Pro y precios ratificados), `constitution.md` (SDD, tipado estricto y capa de datos por módulo), `specs/architecture.md` y `code-rules.md`. Consume el contrato de `specs/api/023-subscription-payments` y reutiliza `mySubscription` y las mutaciones de billing ya definidas.

## Assumptions

- La pestaña se añade al hub existente `/admin/configuracion` (`?tab=suscripcion`); no se crea una ruta nueva.
- La API expone una consulta pública/autenticada con las instrucciones de pago manual y el catálogo del plan; si falta, la vista muestra un estado no disponible y no inventa datos.
- Los precios y la tasa de referencia son datos de servidor y no se hardcodean en Book.
- Los checkouts de PayPal/Binance son redirecciones de página completa, no popups.
- La confirmación del webhook puede tardar; la UI muestra un estado pendiente y permite refrescar.
- La aprobación manual la realiza el Super Admin desde una superficie administrativa; esta vista solo reporta y muestra el estado.
- La UI no almacena datos de pago ni secretos en `localStorage`.
