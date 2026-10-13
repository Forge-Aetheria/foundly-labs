import { request } from 'graphql-request';
import { fail, ok, type ActionResult, type ErrorCode } from './result';

/**
 * Typed GraphQL transport for the Foundly API (feature 008).
 * - Endpoint from `API_URL` (server-side; client components do NOT call this).
 * - Per-call `Authorization: Bearer <token>` injection — never cached at module scope.
 * - Maps the API error envelope `errors[].extensions.code` to the book `ErrorCode`
 *   (admin-catalog.contract.md error table).
 * graphql-request v7: single `request` function, no `GraphQLClient` class.
 */

export function resolveApiUrl(): string | null {
  const url = process.env.API_URL?.trim();
  return url ? url : null;
}

export interface ApiRequestOptions {
  token?: string | null;
}

interface ExtensionsLike {
  code?: string;
}

interface GraphQLErrorLike {
  message?: string;
  extensions?: ExtensionsLike;
}

interface ClientErrorLike {
  response?: { errors?: GraphQLErrorLike[] };
  message?: string;
}

/** Map a GraphQL `extensions.code` to the book `ErrorCode` (contract table). */
export function mapErrorCode(code: string | undefined): ErrorCode | null {
  switch (code) {
    case 'UNAUTHENTICATED':
    case 'FORBIDDEN':
    case 'NOT_FOUND':
    case 'CONFLICT':
    case 'VALIDATION_ERROR':
      return code;
    default:
      return null;
  }
}

/** Extract a typed ActionResult from any thrown GraphQL client error. */
export function mapActionError(error: unknown): ActionResult<never> {
  if (error && typeof error === 'object') {
    const err = error as ClientErrorLike;
    const first = err.response?.errors?.[0];
    if (first?.extensions?.code) {
      const code = mapErrorCode(first.extensions.code);
      if (code) {
        return fail(code, first.message || 'Error de la API');
      }
    }
  }
  return fail('STATE_ERROR', 'No se pudo conectar con el servicio. Inténtalo de nuevo.');
}

/**
 * Execute a GraphQL document against the Foundly API and coerce the result into
 * an `ActionResult<T>`. Failures never throw; they map to typed errors.
 */
export async function apiRequest<TData, TVariables extends object = Record<string, never>>(
  document: string,
  variables: TVariables,
  options: ApiRequestOptions = {},
): Promise<ActionResult<TData>> {
  const url = resolveApiUrl();
  if (!url) {
    return fail('STATE_ERROR', 'API_URL no está configurada.');
  }
  const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) {
    requestHeaders.Authorization = `Bearer ${options.token}`;
  }
  try {
    // graphql-request v7 positions `variables` concretely (object); the typed
    // result comes from the generic `TData` on the call site.
    const data = await request<TData>(`${url.replace(/\/+$/, '')}/graphql`, document, variables, requestHeaders);
    return ok(data);
  } catch (error) {
    return mapActionError(error);
  }
}