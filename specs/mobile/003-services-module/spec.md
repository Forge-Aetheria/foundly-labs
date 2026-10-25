# Feature Specification: Mobile Services Module

**Feature Branch**: `003-services-module`

**Created**: 2026-10-25

**Status**: Implemented (retrospective specification)

**Input**: Conectar el módulo Servicios de `apps/mobile` con la API real, sustituyendo el placeholder “Próximamente”: listar servicios del tenant, crear, editar y eliminar servicios con nombre, descripción, categoría, duración, precio, estado activo y reglas de adelanto, manteniendo loading, refresco, vacío, error y confirmaciones destructivas.

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Esta spec pertenece al dominio `mobile` y se apoya en los contratos GraphQL existentes de `apps/api` y el modelo `Service` de `packages/database`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consultar el catálogo de servicios (Priority: P1)

Un administrador autenticado abre Servicios y ve todos los servicios de su tenant con su información operativa: nombre, categoría, descripción, duración, precio, adelanto y estado.

**Why this priority**: Es la vista base del módulo y reemplaza el placeholder actual.

**Independent Test**: Abrir Servicios con servicios existentes y comprobar que se listan los datos correctos del tenant.

**Acceptance Scenarios**:

1. **Given** un tenant con servicios, **When** el administrador abre Servicios, **Then** ve la lista con nombre, duración, precio, adelanto y estado.
2. **Given** un tenant sin servicios, **When** abre Servicios, **Then** ve un estado vacío informativo.
3. **Given** la lista cargada, **When** hace pull-to-refresh, **Then** se consultan los datos más recientes.
4. **Given** un fallo de red, **When** la consulta falla, **Then** ve un error con opción de reintentar.

---

### User Story 2 - Crear un servicio (Priority: P2)

Un administrador crea un servicio con nombre, categoría, descripción, duración, precio, estado y regla de adelanto opcional.

**Why this priority**: Permite ampliar el catálogo sin depender del panel web.

**Independent Test**: Crear un servicio válido y comprobar que aparece en la lista y persiste al reabrir.

**Acceptance Scenarios**:

1. **Given** el formulario de creación, **When** completa los campos obligatorios y guarda, **Then** el servicio se crea y aparece en la lista.
2. **Given** un precio y duración inválidos, **When** guarda, **Then** se muestran errores de validación y no se envía la mutación.
3. **Given** la regla de adelanto activa, **When** elige importe fijo o porcentaje, **Then** el valor se envía en la unidad correcta.
4. **Given** un fallo de API, **When** guarda, **Then** se muestra el error sin perder el formulario.

---

### User Story 3 - Editar y eliminar servicios (Priority: P3)

Un administrador actualiza los datos de un servicio o lo elimina con confirmación.

**Why this priority**: Completa el ciclo de gestión del catálogo.

**Independent Test**: Editar un servicio, verificar la persistencia y eliminarlo comprobando la desaparición de la lista.

**Acceptance Scenarios**:

1. **Given** un servicio existente, **When** el administrador lo edita y guarda, **Then** la lista refleja los cambios.
2. **Given** un servicio existente, **When** el administrador pulsa eliminar, **Then** se solicita confirmación.
3. **Given** la confirmación de eliminación, **When** la mutación termina, **Then** el servicio desaparece de la lista.
4. **Given** una mutación en curso, **When** el administrador intenta otra acción, **Then** los controles se bloquean y se muestra el progreso.

---

### Edge Cases

- Servicios sin categoría o descripción: se muestran sin esos campos, sin errores.
- Precio `0`: se permite y se muestra formateado.
- Adelanto porcentual superior a 100: se rechaza en validación.
- Servicio inactivo: se muestra como inactivo y no se elimina.
- Error al refrescar con datos previos: se conserva la lista y se informa del error.
- Sesión expirada: la app redirige al login según el flujo existente.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El módulo MUST listar los servicios del tenant autenticado.
- **FR-002**: Cada servicio MUST mostrar nombre, duración, precio, adelanto y estado activo.
- **FR-003**: El módulo MUST mostrar loading inicial, overlay de refresco, estado vacío y error con reintento.
- **FR-004**: El módulo MUST permitir crear servicios con nombre, categoría, descripción, duración, precio, estado y adelanto opcional.
- **FR-005**: El módulo MUST validar nombre obligatorio, duración positiva, precio no negativo y adelanto válido.
- **FR-006**: El módulo MUST convertir precio y adelanto fijo entre euros y céntimos.
- **FR-007**: El módulo MUST permitir editar servicios existentes.
- **FR-008**: El módulo MUST permitir eliminar servicios con confirmación explícita.
- **FR-009**: Las mutaciones MUST mostrar estado de progreso y bloquear acciones duplicadas.
- **FR-010**: Los errores de API MUST mostrarse sin exponer detalles internos.
- **FR-011**: La UI MUST usar exclusivamente tipos y documentos generados por `graphql-codegen`.
- **FR-012**: La pantalla `/servicios` MUST dejar de renderizar el placeholder “Próximamente”.

### Key Entities

- **Servicio**: entidad del tenant con nombre, descripción, categoría, duración, precio, estado y regla de adelanto.
- **Regla de adelanto**: configuración opcional compuesta por tipo (fijo/porcentaje) y valor.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 100% de los servicios del tenant aparecen en la lista con sus datos principales.
- **SC-002**: Crear o editar un servicio se refleja en la lista en menos de 2 segundos en condiciones normales.
- **SC-003**: El 100% de las acciones destructivas solicita confirmación.
- **SC-004**: Las verificaciones de tipos, lint y tests del workspace móvil finalizan sin errores.

## Assumptions

- La API ya expone `myServices`, `createMyService`, `updateMyService` y `deleteMyService`; no se requieren endpoints nuevos.
- El modelo `Service` de `packages/database` cubre todos los campos usados.
- La moneda local del catálogo móvil es EUR, coherente con el panel web.
- La gestión de especialistas asignados a cada servicio queda en el módulo Equipo.
- La spec se crea de forma retroactiva tras la implementación, para restaurar la trazabilidad SDD.

## Dependencies

- Sesión autenticada con tenant.
- API GraphQL de servicios.
- Tipos generados por `graphql-codegen`.
- Servicios existentes para validar creación, edición y eliminación.
