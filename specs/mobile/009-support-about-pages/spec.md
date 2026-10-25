# Feature Specification: Mobile Support and About Pages

**Feature Branch**: `009-support-about-pages`

**Created**: 2026-10-25

**Status**: Draft

**Input**: Activar los módulos Ayuda y Soporte y Acerca de Foundly en `apps/mobile`, sustituyendo sus placeholders “Próximamente” por páginas informativas propias: canales de ayuda/contacto y preguntas frecuentes para Soporte; identidad de Foundly, versión de la app, descripción del producto y enlaces legales/institucionales para Acerca de.

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Esta spec pertenece al dominio `mobile`. Ambos módulos son contenido estático: no requieren API ni cambios de base de datos.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consultar ayuda y contactar con soporte (Priority: P1)

Un administrador autenticado abre Ayuda y Soporte, encuentra respuestas a dudas habituales y dispone de un canal claro para contactar con el equipo de Foundly.

**Why this priority**: Reduce la dependencia del soporte manual y ofrece una salida clara cuando el administrador necesita ayuda.

**Independent Test**: Abrir Soporte y comprobar que se muestran las secciones de ayuda y que la acción de contacto abre el canal externo correspondiente.

**Acceptance Scenarios**:

1. **Given** el administrador autenticado, **When** abre Ayuda y Soporte, **Then** ve una introducción y una lista de preguntas frecuentes.
2. **Given** la lista de preguntas, **When** el administrador expande o consulta una pregunta, **Then** ve la respuesta correspondiente.
3. **Given** la sección de contacto, **When** pulsa el botón de contacto, **Then** se abre el canal externo (correo o web de soporte).
4. **Given** el administrador necesita volver, **When** usa el drawer, **Then** puede navegar a cualquier otro módulo sin perder el estado de sesión.
5. **Given** un enlace externo no disponible, **When** se pulsa, **Then** se informa de forma comprensible sin bloquear la vista.

---

### User Story 2 - Consultar información de Foundly (Priority: P2)

Un administrador autenticado abre Acerca de Foundly y ve la identidad del producto, la versión de la app, una descripción breve y enlaces institucionales/legales.

**Why this priority**: Proporciona contexto de marca, versión y acceso a información legal desde la app.

**Independent Test**: Abrir Acerca de Foundly y comprobar marca, versión, descripción y enlaces.

**Acceptance Scenarios**:

1. **Given** el administrador autenticado, **When** abre Acerca de Foundly, **Then** ve el logo/nombre de Foundly y la versión de la app.
2. **Given** la vista, **When** el administrador revisa la descripción, **Then** entiende qué es Foundly y el rol de la app móvil dentro del ecosistema.
3. **Given** los enlaces institucionales, **When** pulsa uno, **Then** se abre el recurso externo correspondiente.
4. **Given** el administrador quiere volver, **When** usa el drawer, **Then** regresa a otro módulo manteniendo la sesión.

---

### Edge Cases

- Textos largos: se muestran con scroll y sin cortes.
- Preguntas frecuentes sin respuesta: no se muestran o se marcan como no disponibles.
- Enlaces externos caídos o no soportados por el dispositivo: se informa sin bloquear la app.
- Versión de app no disponible: se muestra un valor de reserva legible.
- Modo offline: las páginas estáticas siguen visibles; los enlaces externos pueden fallar y se informa.
- Sesión expirada mientras se navega: se aplica el flujo global de autenticación existente.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: La app MUST sustituir el placeholder de `/soporte` por una página de Ayuda y Soporte.
- **FR-002**: Soporte MUST mostrar una introducción y preguntas frecuentes con sus respuestas.
- **FR-003**: Soporte MUST ofrecer al menos un canal de contacto externo claramente identificado.
- **FR-004**: La app MUST sustituir el placeholder de `/about` por una página Acerca de Foundly.
- **FR-005**: Acerca de MUST mostrar la identidad de Foundly y la versión de la aplicación.
- **FR-006**: Acerca de MUST mostrar una descripción del producto y del rol de la app móvil.
- **FR-007**: Acerca de MUST incluir enlaces institucionales/legales disponibles.
- **FR-008**: Ambas páginas MUST ser desplazables y legibles en teléfono y tableta.
- **FR-009**: Los enlaces externos MUST abrirse de forma segura y gestionar errores de apertura.
- **FR-010**: Ambas páginas MUST reutilizar componentes y tokens del design system móvil.
- **FR-011**: Ambas páginas MUST mantener la navegación y la sesión existentes.
- **FR-012**: No se requieren consultas, mutaciones ni estados de carga de datos para estas páginas.

### Key Entities

- **Pregunta frecuente**: par pregunta/respuesta mostrado en Soporte.
- **Canal de contacto**: destino externo de ayuda (correo o web).
- **Información de producto**: nombre, descripción, versión y enlaces institucionales de Foundly.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 100% de los placeholders de Soporte y Acerca desaparecen.
- **SC-002**: Un administrador encuentra una vía de contacto en Soporte en menos de 30 segundos.
- **SC-003**: La versión y los enlaces institucionales son visibles en Acerca sin pasos adicionales.
- **SC-004**: Ambas páginas se renderizan correctamente en iOS y Android sin pantallas en blanco.
- **SC-005**: Las verificaciones de tipos, lint y tests del workspace móvil finalizan sin errores.

## Assumptions

- Ambos módulos son contenido estático y no requieren API ni base de datos.
- El canal de contacto de soporte se define a nivel de producto (correo o web) y se abre en el navegador/cliente externo.
- Los enlaces legales/institucionales apuntan a los recursos públicos existentes del ecosistema Foundly.
- La versión mostrada proviene de la configuración de la app con un valor de reserva.
- La spec se redacta antes de implementar, siguiendo el flujo SDD.

## Dependencies

- Sesión autenticada y navegación del drawer existentes.
- Recursos públicos de Foundly para enlaces legales/institucionales.
- Configuración de versión de la aplicación móvil.
