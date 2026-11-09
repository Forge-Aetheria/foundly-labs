# Feature Specification: Cierre de Migración a Supabase Auth y Seguridad de Tenant

**Feature Branch**: `021-supabase-auth-tenant-hardening`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Cerrar la migración a Supabase Auth y endurecer la seguridad de tenant en Foundly Labs (apps/book y API): eliminar el sistema legado HMAC, retirar los endpoints obsoletos y hacer que el workspace autenticado se resuelva en el servidor en lugar de filtrar colecciones públicas en el cliente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceso al workspace solo con identidad Supabase (Priority: P1)

Un dueño de negocio inicia sesión con su cuenta de la plataforma y entra al panel. El sistema entrega únicamente la información del negocio vinculado a su identidad verificada; no necesita enviar ni elegir un identificador de negocio, y nunca puede obtener datos de otro negocio.

**Why this priority**: Es el objetivo central del cierre de migración. Sin esto, el backend mantiene dos mecanismos de identidad y la seguridad del workspace depende de decisiones del cliente.

**Independent Test**: Iniciar sesión con una cuenta vinculada a un negocio, abrir el panel y comprobar que se cargan el negocio y el perfil correctos. Repetir con una segunda cuenta de otro negocio y verificar que cada una ve exclusivamente su propio negocio. Probar sin token y con un token manipulado.

**Acceptance Scenarios**:

1. **Given** una cuenta con negocio vinculado, **When** abre el panel con una sesión válida, **Then** recibe los datos de su negocio y perfil sin enviar un identificador de negocio.
2. **Given** dos cuentas vinculadas a negocios distintos, **When** cada una consulta su workspace, **Then** ninguna puede ver ni modificar datos de la otra, incluso manipulando identificadores en la petición.
3. **Given** una petición sin credencial o con una credencial inválida o caducada, **When** intenta acceder a datos del workspace, **Then** la operación se rechaza como no autenticada y no se devuelve información parcial.
4. **Given** una identidad válida sin negocio vinculado, **When** consulta el workspace, **Then** se rechaza con un error de negocio no encontrado o no autorizado, sin exponer datos de otros negocios.

---

### User Story 2 - Retirada completa del mecanismo de autenticación legado (Priority: P1)

El equipo de plataforma retira el sistema de sesiones propio del pasado: ya no se emiten ni aceptan credenciales HMAC, no se publican las operaciones de identidad obsoletas y no queda ningún secreto asociado en la configuración de los entornos.

**Why this priority**: Mantener el mecanismo legado crea confusión, superficie de ataque y una fuente de fallos silenciosos: los clientes actuales usan Supabase Auth, pero el backend conserva operaciones que esperan credenciales que ya nadie emite.

**Independent Test**: Auditar las operaciones protegidas del backend y confirmar que todas aceptan únicamente credenciales de Supabase Auth. Buscar el secreto legado en configuración, documentación de despliegue y validaciones de arranque. Invocar las operaciones retiradas y comprobar que ya no existen.

**Acceptance Scenarios**:

1. **Given** el backend desplegado, **When** se auditan sus operaciones protegidas, **Then** el 100% valida credenciales de Supabase Auth y ninguna acepta el mecanismo HMAC legado.
2. **Given** una credencial HMAC del sistema anterior, **When** se intenta usar en cualquier operación protegida, **Then** la petición se rechaza como no autenticada.
3. **Given** la configuración de cualquier entorno, **When** se revisa, **Then** no aparece el secreto del mecanismo legado ni una validación que lo exija.
4. **Given** un cliente antiguo que invoca las operaciones de identidad retiradas, **When** lo hace, **Then** recibe una respuesta que indica que la operación ya no existe, sin activar un camino alternativo inseguro.

---

### User Story 3 - Operación y diagnóstico sin ambigüedad de identidad (Priority: P2)

El equipo de soporte y operaciones puede distinguir con claridad entre sesión ausente, sesión inválida, identidad sin negocio y negocio no operable, y el panel reacciona de forma consistente sin mostrar datos de sesiones anteriores.

**Why this priority**: La retirada de un mecanismo de identidad puede dejar respuestas ambiguas o cachés con datos de otra sesión. La claridad operativa reduce incidentes y acelera el diagnóstico.

**Independent Test**: Provocar cada condición (sin token, token inválido, identidad sin negocio, negocio suspendido) y verificar que el panel muestra el estado correspondiente, limpia la caché y no conserva datos del negocio previo tras cerrar sesión.

**Acceptance Scenarios**:

1. **Given** una sesión caducada, **When** el usuario intenta operar en el panel, **Then** se le redirige al inicio de sesión y no se muestran datos cacheados del negocio.
2. **Given** un negocio suspendido o inactivo, **When** su dueño intenta acceder al workspace, **Then** el acceso se deniega de forma explícita y coherente.
3. **Given** un cambio de sesión o un cierre de sesión, **When** se vuelve a abrir el panel, **Then** no se reutiliza información del negocio anterior.

---

### Edge Cases

- La credencial es válida pero no contiene vínculo con ningún negocio: se rechaza el acceso al workspace y no se intenta inferir el negocio desde la URL o el cuerpo de la petición.
- La credencial contiene un negocio que ya no existe o está inactivo: se deniega el acceso y no se devuelve un workspace vacío que parezca válido.
- Un cliente antiguo sigue llamando a las operaciones de identidad retiradas: no se ofrece compatibilidad silenciosa ni se reintroduce el mecanismo legado.
- El panel tenía datos cacheados de otra sesión o de otro negocio: la caché se descarta al cerrar sesión, al expirar la sesión o al cambiar de identidad.
- La configuración de Supabase Auth falta o no es accesible: el sistema falla de forma cerrada (no autentica), sin recurrir a un mecanismo alternativo.
- Un usuario intenta actualizar su perfil enviando un identificador de negocio distinto al de su credencial: la operación se rechaza o se ignora el identificador del cliente, prevaleciendo siempre la identidad verificada.
- Las consultas públicas del portal y el directorio siguen funcionando sin sesión y no se ven afectadas por el endurecimiento del workspace.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El backend MUST aceptar como única identidad para operaciones protegidas las credenciales emitidas por Supabase Auth.
- **FR-002**: El backend MUST dejar de emitir, verificar o aceptar sesiones HMAC del sistema legado.
- **FR-003**: El backend MUST retirar las operaciones de identidad obsoletas `me`, `currentTenant` y `bookCapability`, junto con los guards y decoradores que solo existían para el mecanismo legado.
- **FR-004**: El backend MUST eliminar el secreto `FOUNDLY_PASS_SECRET` de los archivos de configuración, ejemplos de entorno, despliegue y validaciones de arranque.
- **FR-005**: Toda operación protegida MUST derivar el negocio exclusivamente del vínculo verificado en la credencial, nunca de un argumento, URL, cabecera personalizada o dato enviado por el cliente.
- **FR-006**: El backend MUST exponer una operación autenticada que devuelva el negocio y el perfil del usuario autenticado.
- **FR-007**: `apps/book` MUST obtener el negocio activo y su perfil mediante la operación autenticada del punto FR-006, en lugar de consultar una colección pública y filtrarla en el cliente.
- **FR-008**: `apps/book` MUST dejar de enviar o depender de un identificador de negocio para resolver el workspace; el identificador puede usarse solo como referencia de presentación una vez validado por el servidor.
- **FR-009**: El backend MUST denegar el acceso al workspace cuando la identidad no tenga negocio vinculado, el negocio no exista o el negocio no esté activo.
- **FR-010**: El backend MUST mantener públicas únicamente las operaciones destinadas al portal público, el directorio y la reserva, sin exponer datos privados del workspace.
- **FR-011**: Las operaciones retiradas MUST dejar de aparecer en el contrato público del backend y MUST actualizarse todos los consumidores del monorepo que aún las referencien.
- **FR-012**: Los fallos de identidad MUST ser consistentes y distinguibles: sesión ausente o inválida, identidad sin negocio y negocio no operable.
- **FR-013**: El panel MUST descartar la información del workspace cacheada cuando la sesión expire, se cierre o cambie de identidad.
- **FR-014**: Las operaciones de actualización del negocio y perfil MUST aplicar los cambios únicamente al negocio derivado de la credencial verificada.
- **FR-015**: La aplicación MUST poder arrancar y operar sin el secreto HMAC legado, y MUST fallar de forma cerrada si la configuración de Supabase Auth no está disponible.

### Key Entities *(include if feature involves data)*

- **Identidad autenticada**: usuario validado por el proveedor de identidad; incluye su identificador y el vínculo con un negocio, si existe.
- **Workspace del negocio**: negocio y perfil que el usuario autenticado puede consultar y editar; su alcance lo determina la identidad verificada, no el cliente.
- **Negocio**: unidad operativa con estado (activo, suspendido, etc.) y perfil público; solo los negocios operables permiten acceso al workspace.
- **Sesión legada**: credencial HMAC del sistema anterior, que se elimina por completo y deja de ser una entidad válida del sistema.
- **Consumidor del workspace**: aplicación del ecosistema (principalmente `apps/book`) que presenta y edita los datos del negocio autenticado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las operaciones protegidas del backend valida únicamente credenciales de Supabase Auth; ninguna acepta el mecanismo HMAC legado.
- **SC-002**: El 100% de los archivos de configuración, despliegue y ejemplos de entorno del backend está libre del secreto HMAC legado.
- **SC-003**: En el 100% de las pruebas con dos cuentas de negocios distintos, ninguna cuenta puede leer ni modificar datos de la otra, incluso manipulando identificadores en la petición.
- **SC-004**: El 100% de las peticiones sin credencial, con credencial inválida o con identidad sin negocio se rechaza sin devolver datos parciales del workspace.
- **SC-005**: Tras cerrar sesión o cambiar de cuenta, el 100% de las pruebas confirma que no quedan datos del negocio anterior visibles en el panel.
- **SC-006**: El panel obtiene el negocio y el perfil con una sola operación autenticada por carga de workspace, sin consultar la colección pública de negocios.
- **SC-007**: La compilación, el tipado y las pruebas automatizadas del monorepo finalizan sin errores ni referencias a las operaciones retiradas.
- **SC-008**: El portal público, el directorio y la reserva siguen funcionando sin sesión con el mismo comportamiento observable que antes del cambio.

## Governance

Esta especificación se subordina a `specs/business-model.md` (identidad única del ecosistema, licenciamiento Foundly Pass y modelo de suscripción), a `constitution.md` (SDD, tipado estricto, capa de datos por módulo y reutilización) y a `specs/architecture.md` (topología del monorepo y variables de entorno). La retirada del mecanismo HMAC no elimina la identidad única del ecosistema: la consolida en Supabase Auth. El campo de plan/licencia del negocio se conserva como dato, aunque esta iteración retira su único consumidor de gating (`bookCapability`); cualquier gating futuro deberá especificarse por separado sobre la identidad verificada.

## Assumptions

- Supabase Auth sigue siendo el proveedor de identidad único del ecosistema; no se introduce otro mecanismo de autenticación.
- El vínculo entre identidad y negocio ya se almacena en los metadatos verificados de la cuenta; no se requiere una migración de datos masiva.
- La operación autenticada de negocio/perfil puede reutilizarse o ampliarse para cubrir todo lo que el panel necesita; no se diseña una nueva entidad de datos.
- Las operaciones retiradas no tienen consumidores externos fuera del monorepo; `apps/book` y `apps/mobile` son los únicos consumidores a actualizar.
- El comportamiento del sistema legado que denegaba el acceso a negocios inactivos se conserva en el nuevo flujo.
- El portal público, el directorio y la reserva son explícitamente fuera de alcance y deben permanecer sin autenticación.
- La caché del panel puede descartarse por completo al cambiar de sesión; no se requiere conservar datos entre usuarios.
