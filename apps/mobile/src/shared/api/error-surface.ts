import type { ErrorCode } from './result';

const MESSAGES: Record<ErrorCode, string> = {
  UNAUTHENTICATED: 'Tu sesión ha expirado. Inicia sesión de nuevo.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'No encontramos la información solicitada.',
  CONFLICT: 'La información cambió mientras la editabas. Actualiza e inténtalo de nuevo.',
  VALIDATION_ERROR: 'Revisa los datos introducidos e inténtalo de nuevo.',
  NETWORK_ERROR: 'No pudimos conectar con Foundly. Comprueba tu conexión.',
  STATE_ERROR: 'No pudimos completar la operación. Inténtalo de nuevo.',
};

export function errorMessage(code: ErrorCode): string {
  return MESSAGES[code];
}
