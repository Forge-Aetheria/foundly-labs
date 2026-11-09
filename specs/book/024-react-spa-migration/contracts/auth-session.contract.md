# Contract — Autenticación y sesión

**Objetivo**: definir el ciclo de sesión en la SPA sin cookies SSR ni middleware (spec FR-005…FR-010, FR-019/FR-020).

## Cliente de identidad

- `@supabase/supabase-js` `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`.
- `auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }`.
- Persistencia en `localStorage` (comportamiento de `@foundly/mobile`).
- Singleton de módulo; nunca se crea uno por render.

## Estado de sesión

```ts
type SessionStatus = 'loading' | 'anonymous' | 'authenticated' | 'missing-tenant';
```

| Derivación | Regla |
|---|---|
| `session` | `supabase.auth.getSession()` y `onAuthStateChange` |
| `userId` | `session.user.id` |
| `tenantId` | `app_metadata.tenant_id` (fallback `tenant_id`) |
| `status` | `loading` inicial; `anonymous` sin sesión; `missing-tenant` con sesión sin tenant; `authenticated` con ambos |

## Ciclo de vida

1. Al arrancar: `getSession()` → aplicar estado.
2. Suscripción a `onAuthStateChange` → aplicar estado (login, logout, refresh, cambio de pestaña).
3. Login: `signInWithPassword({ email, password })` → verificar contra API (`Viewer`) → si falla, `signOut` y error localizado.
4. Logout: tareas previas → `supabase.auth.signOut()` → `queryClient.clear()` → estado `anonymous`.
5. Cambio de contraseña: reautenticación con contraseña actual + `updateUser({ password })`.

## Sesión expirada / rechazada

- El transporte detecta `UNAUTHENTICATED` de la API y emite `emitUnauthenticated()`.
- `SessionProvider` escucha el evento: `queryClient.clear()`, aplica sesión `null` y redirige a `/login?reason=session-expired`.
- No debe existir bucle de redirección: el evento se procesa una vez y el login no reemite.

## Guards

- Implementados como componentes de ruta (`<RequireAuth>`, `<RequireTenant>`, `<RequireAnonymous>`), reutilizando la lógica pura de `shared/auth/authGuard.ts`.
- No renderizan contenido protegido durante `loading`.
- El `tenantId` SIEMPRE proviene de la sesión, nunca de la URL ni de parámetros.

## Reglas de seguridad

- Ningún secreto (`service role`) en el bundle ni en el tráfico del navegador.
- No usar `dangerouslySetInnerHTML` con datos de usuario.
- La sesión se limpia por completo en logout y expiración.
- El token se adjunta solo al endpoint configurado del API.
- El alcance multi-tenant lo refuerza el API; el cliente añade `tenantId` a las claves de caché para evitar fugas visuales.

## Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima pública |
| `VITE_API_URL` | Base del API GraphQL |
| `VITE_API_REQUEST_TIMEOUT_MS` | Timeout opcional (default 10000) |

## Criterios de aceptación

- Recargar una ruta protegida con sesión válida no expulsa al usuario.
- Abrir una ruta protegida sin sesión redirige a login.
- Tras logout, atrás en el historial no muestra datos protegidos.
- Un `UNAUTHENTICATED` limpia la caché y lleva a login con motivo.
- Con sesión pero sin tenant, se redirige a onboarding.
