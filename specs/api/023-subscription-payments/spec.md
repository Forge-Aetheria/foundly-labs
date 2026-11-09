# Feature Specification: Subscription Payments & Billing

**Feature Branch**: `023-subscription-payments`

**Created**: 2026-11-09

**Status**: Draft

**Input**: Implementar el cobro de suscripciones de Foundly Book con PayPal y Binance Pay automatizados, más Pago Móvil/Transferencia en bolívares con aprobación manual, registro de transacciones, webhooks seguros, activación/extensión de la suscripción y alertas operativas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pagar la suscripción con una pasarela automatizada (Priority: P1)

Un dueño de negocio elige pagar su plan con PayPal o Binance Pay. El sistema crea una intención de pago y le devuelve la información necesaria para completar el checkout. Cuando el proveedor confirma el pago, la suscripción se activa o se extiende sin intervención manual.

**Why this priority**: Es la vía principal de cobro recurrente y la que reduce el trabajo operativo.

**Independent Test**: Crear una orden de PayPal y otra de Binance para un tenant Free, completar el pago en el proveedor (o simular su webhook válido) y verificar que la transacción pasa a completada y el tenant pasa a Pro con nueva fecha de vencimiento.

**Acceptance Scenarios**:

1. **Given** un tenant Free autenticado, **When** solicita pagar con PayPal, **Then** recibe una referencia/URL de checkout y se registra una transacción pendiente asociada a su tenant.
2. **Given** una transacción PayPal pendiente, **When** llega una confirmación válida de pago completado, **Then** la transacción pasa a completada, el tenant pasa a Pro y su vencimiento se actualiza.
3. **Given** un tenant Free autenticado, **When** solicita pagar con Binance Pay, **Then** recibe la información de pago y se registra una transacción pendiente.
4. **Given** una transacción Binance pendiente, **When** llega una confirmación válida de pago completado, **Then** la suscripción se activa o extiende automáticamente.
5. **Given** una transacción pendiente, **When** el tenant consulta su estado, **Then** ve que aún no está completada y no obtiene beneficios Pro todavía.

---

### User Story 2 - Pagar en bolívares con validación manual (Priority: P1)

Un dueño de negocio paga por Pago Móvil o transferencia bancaria en bolívares y reporta la referencia, banco, monto y teléfono. El sistema registra el pago como pendiente de aprobación y alerta al operador para que lo audite.

**Why this priority**: Es el método local principal para clientes venezolanos y requiere control humano antes de conceder el plan.

**Independent Test**: Enviar un pago manual desde un tenant Free y comprobar que la transacción queda pendiente, que no cambia el plan y que el operador recibe la alerta con referencia, monto y tenant.

**Acceptance Scenarios**:

1. **Given** un tenant autenticado, **When** reporta un Pago Móvil con referencia, banco, monto, moneda y teléfono, **Then** se crea una transacción pendiente de aprobación vinculada a su tenant.
2. **Given** un pago manual pendiente, **When** el operador recibe la alerta, **Then** puede identificar la referencia, el monto, la moneda y el negocio afectado.
3. **Given** un pago manual pendiente, **When** el tenant consulta su suscripción, **Then** el plan sigue siendo el anterior y el pago aparece como pendiente.
4. **Given** una transferencia bancaria reportada, **When** se registra, **Then** se distingue de Pago Móvil en el historial y en la alerta operativa.

---

### User Story 3 - Aprobar un pago manual (Priority: P1)

Un Super Admin revisa un pago manual pendiente y lo aprueba. La transacción pasa a completada y la suscripción del negocio se activa o extiende de inmediato.

**Why this priority**: Sin aprobación, el flujo manual nunca entrega valor y el negocio queda bloqueado.

**Independent Test**: Con una transacción pendiente, aprobarla como Super Admin y verificar que pasa a completada, que el tenant recibe el plan y el nuevo vencimiento, y que una segunda aprobación no duplica la vigencia.

**Acceptance Scenarios**:

1. **Given** una transacción manual pendiente, **When** un Super Admin la aprueba, **Then** pasa a completada y el tenant recibe el plan y vencimiento correspondientes.
2. **Given** una transacción ya completada, **When** se intenta aprobar de nuevo, **Then** no se concede vigencia adicional y la operación es idempotente.
3. **Given** una transacción inexistente o de otro tenant, **When** se intenta aprobar, **Then** se rechaza sin cambios.
4. **Given** un usuario que no es Super Admin, **When** intenta aprobar un pago, **Then** se rechaza por permisos.

---

### User Story 4 - Auditar y operar pagos con seguridad (Priority: P2)

El equipo de plataforma necesita que las confirmaciones de pago sean auténticas, idempotentes y auditables, y que un pago fallido o rechazado no active la suscripción.

**Why this priority**: Los webhooks y las aprobaciones son operaciones sensibles; un duplicado o una firma inválida no deben conceder acceso.

**Independent Test**: Reenviar el mismo webhook dos veces, enviar una firma inválida y aprobar una transacción fallida; en todos los casos el plan no debe activarse dos veces ni por una confirmación no auténtica.

**Acceptance Scenarios**:

1. **Given** un webhook con firma/token inválido, **When** se procesa, **Then** se rechaza y no cambia ninguna transacción ni suscripción.
2. **Given** un webhook válido ya procesado, **When** se recibe de nuevo, **Then** no se duplica la vigencia ni se crea otra transacción.
3. **Given** una transacción fallida o rechazada, **When** se intenta activar por otra vía, **Then** no concede plan.
4. **Given** un pago completado, **When** se audita, **Then** existe un registro con proveedor, orden/referencia, importe, moneda, estado y fechas.

---

### Edge Cases

- El mismo pago llega dos veces por webhook o por reintento del proveedor: se procesa una sola vez.
- La firma del webhook es inválida o el token secreto no coincide: se rechaza sin cambios.
- El pago corresponde a un tenant inexistente o suspendido: se registra como fallido/rechazado y no activa plan.
- El importe confirmado por el proveedor no coincide con el esperado: se marca para revisión y no se activa automáticamente.
- Un pago manual llega con una referencia ya registrada: se rechaza o se marca como duplicado, sin crear dos vigencias.
- Un pago manual se aprueba después de que la transacción fue rechazada: no se permite.
- La suscripción actual aún está vigente: el nuevo pago extiende desde la fecha de vencimiento existente, no desde la fecha actual.
- La suscripción ya venció: el nuevo pago activa desde la fecha de confirmación.
- El pago se crea pero el usuario nunca completa el checkout: la transacción queda pendiente y expira sin conceder acceso.
- El tenant está suspendido: no puede iniciar un nuevo pago salvo que la operación de billing esté explícitamente permitida para renovación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST registrar cada intento de pago de suscripción como una transacción auditable con tenant, proveedor, estado, importe, moneda, referencias y fechas.
- **FR-002**: El sistema MUST distinguir los proveedores PayPal, Binance Pay, Pago Móvil y Transferencia.
- **FR-003**: El sistema MUST distinguir el ciclo de vida del pago del ciclo de vida de la suscripción existente, sin reutilizar ni romper los estados actuales de suscripción.
- **FR-004**: Un tenant autenticado MUST poder iniciar una orden de pago con PayPal y recibir la información necesaria para completar el checkout.
- **FR-005**: Un tenant autenticado MUST poder iniciar una orden de pago con Binance Pay y recibir la información necesaria para completar el pago.
- **FR-006**: Un tenant autenticado MUST poder reportar un Pago Móvil o Transferencia con referencia, banco, importe, moneda y teléfono.
- **FR-007**: Los pagos manuales MUST crearse en estado pendiente de aprobación y MUST NOT conceder plan hasta ser aprobados.
- **FR-008**: Al registrarse un pago manual pendiente, el sistema MUST emitir una alerta operativa con referencia, importe, moneda y tenant.
- **FR-009**: Un Super Admin MUST poder aprobar un pago manual pendiente; la aprobación MUST marcar la transacción como completada y activar o extender la suscripción.
- **FR-010**: La aprobación de un pago MUST ser idempotente: una transacción completada no puede volver a conceder vigencia.
- **FR-011**: El sistema MUST recibir confirmaciones de PayPal y Binance a través de una superficie HTTP separada de las operaciones GraphQL del cliente.
- **FR-012**: Toda confirmación de webhook MUST validar autenticidad mediante la firma o token secreto del proveedor antes de modificar datos.
- **FR-013**: Todo webhook MUST ser idempotente: un evento repetido no puede duplicar la transacción ni extender dos veces la suscripción.
- **FR-014**: Una confirmación de pago completada MUST actualizar la transacción y la suscripción del tenant de forma consistente; un pago fallido o rechazado MUST NOT activar el plan.
- **FR-015**: El importe y la duración de la suscripción MUST ser determinados por el servidor a partir del plan configurado; el cliente no puede imponer arbitrariamente el plan, la duración o el importe que se le concede.
- **FR-016**: El vencimiento otorgado por un pago MUST calcularse desde el mayor entre la fecha actual y el vencimiento vigente del tenant.
- **FR-017**: Las operaciones de cliente MUST derivar el tenant exclusivamente de la identidad autenticada, nunca de un identificador enviado por el cliente.
- **FR-018**: La aprobación manual MUST estar restringida a Super Admin y MUST rechazar identidades sin permiso.
- **FR-019**: El sistema MUST permitir consultar el estado de las transacciones del tenant autenticado sin exponer transacciones de otros negocios.
- **FR-020**: Las transacciones MUST conservar metadatos suficientes para auditoría y conciliación sin almacenar secretos de las pasarelas.
- **FR-021**: Los pagos pendientes o expirados MUST NOT conceder acceso Pro.
- **FR-022**: La activación de un pago completado MUST actualizar el plan y el vencimiento del tenant sin borrar ni desactivar servicios o equipo existentes.
- **FR-023**: Los errores de pago MUST ser distinguibles de los errores de plan y de autenticación, con mensajes accionables para el usuario y el operador.
- **FR-024**: El sistema MUST registrar los eventos de pago y aprobación de forma estructurada para diagnóstico y auditoría.

### Key Entities

- **Transacción de pago**: intento de cobro de suscripción; incluye tenant, proveedor, estado, importe, moneda, referencia externa, referencia manual, metadatos, vencimiento otorgado y fechas.
- **Estado de pago**: ciclo de vida del intento de cobro (`pendiente de confirmación`, `pendiente de aprobación`, `completado`, `rechazado`, `fallido`), separado del estado de suscripción.
- **Proveedor de pago**: PayPal, Binance Pay, Pago Móvil o Transferencia.
- **Plan de suscripción**: configuración del plan vendido, con importe, moneda y duración; el servidor es la autoridad.
- **Suscripción del tenant**: plan, estado y vencimiento efectivos que ya existen en el negocio y que se actualizan al completar un pago.
- **Alerta operativa**: aviso al administrador con los datos mínimos para auditar un pago manual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un pago automatizado completado activa o extiende la suscripción en menos de 1 minuto desde la confirmación válida del proveedor.
- **SC-002**: El 100% de los webhooks con firma inválida se rechaza sin cambios en transacciones o suscripciones.
- **SC-003**: El 100% de los webhooks duplicados produce una sola activación/extensión.
- **SC-004**: El 100% de los pagos manuales pendientes genera una alerta operativa con referencia, importe, moneda y tenant.
- **SC-005**: El 100% de las aprobaciones manuales válidas actualiza el plan y el vencimiento; una segunda aprobación no añade vigencia.
- **SC-006**: El 100% de las transacciones de un tenant son invisibles para cualquier otro tenant.
- **SC-007**: El 100% de los pagos fallidos o rechazados no concede acceso Pro.
- **SC-008**: Un dueño puede iniciar un pago y conocer su estado sin ambigüedad en menos de 3 minutos.

## Governance

Esta especificación se subordina a `specs/business-model.md` (licenciamiento Foundly Pass, módulos y regla de precios ratificados), `constitution.md` (SDD, tipado estricto, seguridad y capa de datos), `specs/architecture.md` (topología, variables y superficies HTTP) y `code-rules.md`. Reutiliza el modelo de plan efectivo de `specs/api/017-subscription-plans` y el estado operativo del tenant de `specs/api/022-tenant-status-plan-gating`. No modifica el enum de estado de suscripción existente.

## Assumptions

- Los precios, monedas y duraciones concretas de los planes se configuran en el servidor y no se inventan en la UI; `specs/business-model.md` mantiene los importes como `TBD` hasta su ratificación.
- PayPal y Binance Pay exponen APIs oficiales y secretos configurables por entorno; las firmas/tokens se validan con esos secretos.
- La duración del plan la define el catálogo de planes, no el cliente.
- Un pago manual en bolívares se audita por su importe y referencia; la aprobación del operador es la autoridad final para conceder el plan.
- El estado `SUSPENDED` de la nueva propuesta se representa con el `Tenant.status` existente y/o el estado de suscripción actual; no se renombra el enum `SubscriptionStatus` para evitar una migración incompatible.
- Las operaciones de cliente siguen en GraphQL; únicamente los webhooks usan HTTP nativo.
- Los pagos manuales expiran si no se aprueban en un plazo operativo configurable; hasta entonces no conceden acceso.
- El frontend de checkout y la vista de estado se especificarán en una spec de dominio `book` posterior; esta spec define el contrato de API.
