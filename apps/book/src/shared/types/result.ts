export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'STATE_ERROR'
  | 'NOT_FOUND'
  | 'EMAIL_TAKEN'
  | 'SLUG_TAKEN';

export interface ActionError {
  code: ErrorCode;
  message: string;
  fields?: Record<string, string>;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>,
): ActionResult<T> {
  return { ok: false, error: fields ? { code, message, fields } : { code, message } };
}

export function zodFields(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map((part) => String(part)).join('.') || '_';
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}
