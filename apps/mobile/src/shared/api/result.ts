export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'STATE_ERROR';

export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; code: ErrorCode; message: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: ErrorCode, message: string): ActionResult<T> {
  return { ok: false, code, message };
}
