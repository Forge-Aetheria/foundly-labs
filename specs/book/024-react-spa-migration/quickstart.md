# Quickstart — Validación de la migración SPA

Guía ejecutable para validar la feature de extremo a extremo. No contiene la implementación; los detalles están en [`data-model.md`](./data-model.md) y [`contracts/`](./contracts/).

## 0. Prerrequisito bloqueante

Antes de ejecutar cualquier escenario, confirmar que las enmiendas de gobernanza están ratificadas (ver `spec.md` §Impacto de gobernanza y `plan.md` Constitution Check). Sin esto, la implementación no debe comenzar.

## 1. Requisitos

- Node.js 24 + pnpm 10 (Corepack).
- Acceso al proyecto Supabase (auth + storage) y a la API GraphQL.
- Navegador moderno; Playwright instalado para E2E.

## 2. Configuración

En `apps/book/.env` (o `.env.local`):

```text
VITE_API_URL=http://localhost:3002
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
# opcional
VITE_API_REQUEST_TIMEOUT_MS=10000
```

En `apps/api` (runtime servidor, no en el bundle):

```text
SUPABASE_URL=<supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role>
SUPABASE_AUTH_URL=<supabase-url>
CORS_ORIGINS=http://localhost:3001,http://localhost:5173
```

## 3. Comandos

```bash
# instalar
pnpm install

# codegen (snapshot del SDL del API)
pnpm --filter @foundly/book codegen

# desarrollo SPA
pnpm --filter @foundly/book dev

# API
pnpm --filter @foundly/api dev

# gates
pnpm --filter @foundly/book typecheck
pnpm --filter @foundly/book lint
pnpm --filter @foundly/book test
pnpm --filter @foundly/book build
```

## 4. Escenarios de validación

### V1 — Sesión y guards (US1 / FR-005…FR-010)

1. Sin sesión, abrir `/admin/agenda` → redirección a `/login`.
2. Iniciar sesión con credenciales válidas → llegar a `/admin/agenda`.
3. Recargar (F5) en `/admin/agenda` → sesión restaurada, sin volver al login.
4. Abrir una segunda pestaña → sesión compartida.
5. Cerrar sesión → `/login`, y el botón atrás no muestra datos protegidos.
6. Forzar `UNAUTHENTICATED` (token inválido) en una operación → limpieza + `/login?reason=session-expired`.
7. Autenticado, abrir `/login` → redirección al panel.

**Esperado**: sin bucles de redirección, sin contenido protegido durante `loading`.

### V2 — Panel y mutaciones (US2 / FR-011…FR-018)

1. En `/admin/services`, crear un servicio válido → aparece en la lista sin recargar.
2. Enviar datos inválidos → errores de campo, sin llamada al API.
3. En `/admin/agenda`, crear/cancelar/reprogramar una cita → agenda y contadores actualizados.
4. En `/admin/notificaciones`, marcar leída → cabecera y lista sincronizadas.
5. Doble clic en un submit → una sola operación.
6. Simular error de permisos/conflicto → mensaje localizado, no texto técnico.
7. Simular API lenta/caída → estado de error recuperable, sin pantalla en blanco.

**Esperado**: invalidación de caché correcta y estados consistentes.

### V3 — Portal público y reserva (US3 / FR-021…FR-023)

1. Abrir `/`, `/negocios` y filtrar por texto/categoría.
2. Abrir `/:tenantSlug` de un negocio activo → servicios, horarios, profesionales, galería, reseñas.
3. Abrir un slug inexistente, en borrador, suspendido y no público → panel de indisponibilidad correcto.
4. Completar una reserva con y sin anticipo; adjuntar comprobante válido.
5. Adjuntar archivo inválido (>5 MB o formato no admitido) → rechazo claro y formulario conservado.
6. Enviar una reseña → registrada y visible según reglas.

**Esperado**: flujo completo sin autenticación y sin errores técnicos.

### V4 — Onboarding seguro (US4 / FR-019/FR-020)

1. Completar el alta con email y slug nuevos → cuenta creada, negocio creado y vinculado.
2. Intentar el alta con email existente → `EMAIL_TAKEN`, sin datos parciales visibles.
3. Intentar el alta con slug en uso → `SLUG_TAKEN` antes de enviar.
4. Simular fallo de vinculación → error recuperable; no queda cuenta huérfana utilizable.
5. Inspeccionar `dist/` y el tráfico del navegador → no aparece el `service role`.

**Esperado**: alta funcional y cero credenciales administrativas en cliente.

### V5 — Rutas, metadatos y 404 (US5 / FR-002…FR-004, FR-024/FR-025)

1. Abrir directamente cada URL de la tabla de rutas y recargar.
2. Verificar redirecciones: `/directorio`, `/register?email=…`, `/admin`, `/admin/profile`.
3. Recargar `/:tenantSlug` y rutas con `?tab=`, `?from=`, `?to=`, `?q=`, `?page=`.
4. Comprobar título/metadatos por ruta y manifest/iconos.
5. Abrir una ruta inexistente → 404 de marca.
6. Usar atrás/adelante del navegador → estado coherente.

**Esperado**: paridad de navegación y metadatos.

### V6 — Gates técnicos (FR-030…FR-032)

```bash
pnpm --filter @foundly/book typecheck
pnpm --filter @foundly/book lint
pnpm --filter @foundly/book test
pnpm --filter @foundly/book build
pnpm --filter @foundly/api test
```

- Build genera estáticos en `apps/book/dist/`.
- Ningún import de `next`, `@supabase/ssr` ni del índice raíz de `@foundly/database` en el bundle.
- Pruebas E2E de V1–V5 en verde.

## 5. Criterios de aceptación globales

Los definidos en `spec.md` §Success Criteria (SC-001…SC-010). La feature se considera validada cuando V1–V6 pasan y no hay regresiones de las features 001–023.

## 6. Limpieza

- No versionar `generated.ts` ni `dist/`.
- Confirmar que `.env` con secretos está ignorado.
- Revisar que no quedan artefactos de Next (`next.config.mjs`, `next-env.d.ts`, `.next/`, `middleware.ts`).
