import type { ErrorCode } from '../types/result';

/**
 * Error surface taxonomy (feature 012 — centralized API error handling).
 *
 * Classifies an `ErrorCode` by HOW the UI must present it, so components stop
 * painting raw backend text inline and the session case is handled globally:
 *
 * - `session`   → global handler (clear session + redirect to `/login`).
 * - `transient` → clean, dismissible alert (connection / missing resource).
 * - `inline`    → field-level feedback in the owning form.
 */
export type ErrorSurface = 'session' | 'transient' | 'inline';

export function errorSurface(code: ErrorCode): ErrorSurface {
  switch (code) {
    case 'UNAUTHENTICATED':
      return 'session';
    case 'STATE_ERROR':
    case 'NOT_FOUND':
      return 'transient';
    default:
      return 'inline';
  }
}

/**
 * User-facing Spanish message for a code. Never returns the raw provider text
 * (the API speaks English: "Unauthenticated", "Service not found", …).
 */
export function errorMessage(code: ErrorCode, fallback?: string): string {
  switch (code) {
    case 'UNAUTHENTICATED':
      return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
    case 'FORBIDDEN':
      return 'No tienes permisos para realizar esta operación.';
    case 'NOT_FOUND':
      return 'No encontramos el recurso solicitado.';
    case 'CONFLICT':
      return 'Ya existe un registro con esos datos.';
    case 'STATE_ERROR':
      return 'No pudimos conectar con el servicio. Inténtalo de nuevo.';
    case 'VALIDATION_ERROR':
      return fallback && fallback.trim() ? fallback : 'Revisa los datos e inténtalo de nuevo.';
    case 'EMAIL_TAKEN':
      return 'Ese email ya está registrado.';
    case 'SLUG_TAKEN':
      return 'Ese enlace público ya está en uso.';
    default:
      return 'Ha ocurrido un error inesperado.';
  }
}
