# Feature Specification: Mobile Reviews Module

**Feature Branch**: `007-reviews-module`

**Created**: 2026-10-25

**Status**: Draft

**Input**: Activar el módulo Reseñas en `apps/mobile`, sustituyendo el placeholder “Próximamente”: listar las reseñas del tenant, filtrarlas por estado, aprobarlas o rechazarlas para moderación y eliminarlas con confirmación, manteniendo loading, refresco, vacío y error.

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Esta spec pertenece al dominio `mobile` y se apoya en los contratos GraphQL existentes de `apps/api` y el modelo `Review` de `packages/database`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consultar y filtrar reseñas (Priority: P1)

Un administrador autenticado abre Reseñas y ve las valoraciones de su negocio con autor, puntuación, comentario, fecha y estado. Puede filtrar por todas, pendientes, aprobadas o rechazadas.

**Why this priority**: Es la vista base del módulo y reemplaza el placeholder actual.

**Independent Test**: Abrir Reseñas con reseñas en distintos estados y comprobar la lista y los filtros.

**Acceptance Scenarios**:

1. **Given** un tenant con reseñas, **When** el administrador abre Reseñas, **Then** ve autor, puntuación, comentario, fecha y estado.
2. **Given** la lista cargada, **When** selecciona un filtro, **Then** solo se muestran las reseñas de ese estado.
3. **Given** un tenant sin reseñas, **When** abre Reseñas, **Then** ve un estado vacío informativo.
4. **Given** la lista cargada, **When** hace pull-to-refresh, **Then** se consultan los datos más recientes y se muestra el progreso.
5. **Given** un fallo de red, **When** la consulta falla, **Then** ve un error comprensible con opción de reintentar.

---

### User Story 2 - Aprobar o rechazar reseñas (Priority: P2)

Un administrador modera una reseña pendiente aprobándola o rechazándola. Solo las aprobadas se publican en la página pública.

**Why this priority**: Es el núcleo operativo del módulo de reseñas.

**Independent Test**: Aprobar una reseña pendiente, comprobar el cambio de estado y repetir con rechazo.

**Acceptance Scenarios**:

1. **Given** una reseña pendiente, **When** el administrador la aprueba, **Then** su estado pasa a aprobada y se publica.
2. **Given** una reseña pendiente, **When** el administrador la rechaza, **Then** su estado pasa a rechazada y no se publica.
3. **Given** una reseña ya aprobada, **When** se intenta aprobar de nuevo, **Then** la acción no está disponible.
4. **Given** una reseña ya rechazada, **When** se intenta rechazar de nuevo, **Then** la acción no está disponible.
5. **Given** una mutación en curso, **When** el administrador intenta otra acción, **Then** los controles se bloquean y se muestra progreso.
6. **Given** un fallo al moderar, **When** la mutación falla, **Then** el estado no cambia y se informa del error.

---

### User Story 3 - Eliminar una reseña (Priority: P3)

Un administrador elimina definitivamente una reseña con confirmación previa.

**Why this priority**: Permite retirar contenido inapropiado o spam.

**Independent Test**: Eliminar una reseña, confirmar el diálogo y comprobar que desaparece de la lista.

**Acceptance Scenarios**:

1. **Given** una reseña existente, **When** el administrador pulsa eliminar, **Then** se solicita confirmación explícita.
2. **Given** la confirmación, **When** la eliminación termina, **Then** la reseña desaparece de la lista.
3. **Given** un fallo al eliminar, **When** la mutación falla, **Then** la reseña permanece y se informa del error.
4. **Given** una eliminación en curso, **When** el administrador intenta otra acción, **Then** los controles se bloquean y se muestra el progreso.

---

### Edge Cases

- Reseña con comentario largo: se muestra de forma legible y truncada si es necesario.
- Puntuación fuera del rango esperado: se muestra el valor recibido sin romper la tarjeta.
- Filtro sin resultados: se muestra un estado vacío específico, no una pantalla en blanco.
- Error al refrescar con datos previos: se conserva la lista y se informa del problema.
- Moderación concurrente desde web y móvil: la lista se invalida y refleja el estado confirmado por el servidor.
- Sesión expirada: la app redirige al login según el flujo existente.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El módulo MUST listar las reseñas del tenant autenticado.
- **FR-002**: Cada reseña MUST mostrar autor, puntuación, comentario, fecha y estado.
- **FR-003**: El módulo MUST permitir filtrar por todas, pendientes, aprobadas y rechazadas.
- **FR-004**: El módulo MUST mostrar loading inicial, overlay de refresco, estado vacío y error con reintento.
- **FR-005**: El módulo MUST permitir aprobar reseñas pendientes o rechazadas.
- **FR-006**: El módulo MUST permitir rechazar reseñas pendientes o aprobadas.
- **FR-007**: El módulo MUST impedir repetir la acción de moderación ya aplicada.
- **FR-008**: El módulo MUST permitir eliminar reseñas con confirmación explícita.
- **FR-009**: Las mutaciones MUST mostrar estado de progreso y bloquear acciones duplicadas.
- **FR-010**: Los errores de API MUST mostrarse sin exponer detalles internos.
- **FR-011**: La UI MUST usar exclusivamente tipos y documentos generados por `graphql-codegen`.
- **FR-012**: La pantalla `/resenas` MUST dejar de renderizar el placeholder “Próximamente”.

### Key Entities

- **Reseña**: valoración del tenant con autor, puntuación, comentario, fecha y estado de moderación.
- **Estado de reseña**: `pending`, `approved` o `rejected`.
- **Filtro de reseñas**: todas o uno de los estados.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 100% de las reseñas del tenant aparecen en la lista con sus datos principales.
- **SC-002**: Aprobar o rechazar una reseña se refleja en la lista en menos de 2 segundos en condiciones normales.
- **SC-003**: El 100% de las acciones destructivas solicita confirmación.
- **SC-004**: El 95% de los administradores identifica y modera una reseña pendiente en su primer intento.
- **SC-005**: Las verificaciones de tipos, lint y tests del workspace móvil finalizan sin errores.

## Assumptions

- La API ya expone `myReviews`, `setReviewState` y `deleteReview`; no se requieren endpoints nuevos.
- El modelo `Review` de `packages/database` cubre autor, puntuación, comentario, fecha y estado.
- La creación de reseñas por clientes queda fuera del alcance móvil de administración; se gestiona desde el flujo público existente.
- Solo las reseñas aprobadas se publican en la página pública.
- La spec se redacta antes de implementar, siguiendo el flujo SDD.

## Dependencies

- Sesión autenticada con tenant.
- API GraphQL de reseñas y moderación.
- Tipos generados por `graphql-codegen`.
- Reseñas existentes en distintos estados para validar filtros y moderación.
