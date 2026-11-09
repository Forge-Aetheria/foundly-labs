# Contract — Capa de datos por módulo (`services.ts` + `hooks.ts`)

**Objetivo**: definir la forma canónica de acceso a datos en la SPA (spec FR-011…FR-018).

## Principios

- La UI (componentes, dialogs, Views) **no** importa `apiRequest`, `generated.ts` ni TanStack directamente.
- Toda operación pasa por un hook de `hooks.ts`.
- Toda validación, mapeo DTO→dominio y llamada al API vive en `services.ts`.
- Los documentos y tipos GraphQL provienen exclusivamente de `shared/api/generated.ts` (codegen).
- No se declaran DTOs manuales del contrato GraphQL.

## `services.ts`

```ts
// Función de lectura
export async function fetchProfile(tenantId: string): Promise<ActionResult<Tenant>>;

// Función de escritura
export async function updateProfile(input: unknown): Promise<ActionResult<Tenant>>;
```

Reglas:

1. Recibe `input: unknown` en escrituras y valida con Zod (`utils/schemas.ts`).
2. Devuelve `ActionResult<T>`; nunca lanza por error de API.
3. Mapea DTO del API → tipo de dominio con mappers puros (reutiliza los existentes).
4. Adjunta el token vigente mediante el transporte (el servicio no gestiona la sesión).
5. Errores de validación → `VALIDATION_ERROR` con `fields`.
6. Errores del API → `mapActionError` (código + mensaje localizado).

## `hooks.ts`

Nomenclatura obligatoria: `use<Acción><Entidad|Módulo>`.

```ts
// Lectura
export function useProfile(tenantId: string | null) {
  return useQuery({
    queryKey: profileKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => unwrap(await fetchProfile(tenantId!)),
  });
}

// Escritura
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: unknown) => {
      const result = await updateProfile(input);
      if (!result.ok) throw toAppError(result.error);
      return result.data;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}
```

Reglas:

1. `useQuery` para lecturas con `enabled` cuando falte el scope (tenantId/slug).
2. `useMutation` para escrituras; `isPending` para deshabilitar submit (anti doble envío).
3. `onSettled`/`onSuccess` invalidan por prefijo del dominio afectado.
4. Las claves se importan desde `shared/api/query-client.ts` (no se inventan en el módulo).
5. Los errores se normalizan a `AppQueryError` con `code` y `message` localizado.
6. Los formularios que necesitan errores por campo pueden consumir el `ActionResult` directamente a través de un hook dedicado; en ese caso el hook devuelve `ActionResult` y no lanza.

## Invalidación canónica

| Mutación | Invalida |
|---|---|
| crear/editar/cancelar/reprogramar cita | `['agenda']` |
| CRUD servicio | `['services']`, `['public-business']` |
| CRUD/estado personal | `['staff']`, `['availability']` |
| guardar disponibilidad / bloqueos | `['availability']`, `['time-blocks']` |
| galería | `['gallery']`, `['public-business']` |
| perfil | `['profile']`, `['workspace']`, `['public-business']` |
| pagos | `['payments']`, `['public-business']` |
| reseñas | `['reviews']`, `['public-business']` |
| notificaciones | `['notifications']` (y contador no leído) |
| onboarding | `['workspace']` tras login |
| super admin | `['platform-metrics']`, `['managed-businesses']` |

## Transversales

- `shared/api/client.ts`: `apiRequest`, timeout, `mapActionError`, `emitUnauthenticated`.
- `shared/api/query-client.ts`: `createQueryClient`, claves canónicas, `clearTenantCache`.
- `shared/api/error-surface.ts`: clasificación `session | transient | inline` y mensajes.
- `shared/auth/session-context.tsx`: token y estado de sesión.

## Criterios de aceptación

- Ningún componente importa el transporte ni TanStack.
- Toda escritura valida con Zod antes de llamar al API.
- Toda mutación invalida el dominio afectado y la UI se actualiza sin recargar.
- Un error `UNAUTHENTICATED` en cualquier servicio dispara el flujo global de sesión.
