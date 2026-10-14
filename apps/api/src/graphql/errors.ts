import type { GraphQLFormattedError } from 'graphql';

/** Application error codes preserved verbatim by the normalizer (006/008 contract). */
export const KNOWN_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_ERROR',
  'PLAN_LIMIT_REACHED',
] as const;

export const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR';
export const BAD_REQUEST = 'BAD_REQUEST';

const PARSE_OR_VALIDATION = ['GRAPHQL_PARSE_FAILED', 'GRAPHQL_VALIDATION_FAILED'];

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

interface ExtensionsLike {
  code?: unknown;
  stacktrace?: unknown;
}

interface FormattedLike {
  message: string;
  path?: readonly (string | number)[];
  extensions?: ExtensionsLike;
}

/**
 * Normalizes every returned error to the envelope `{ code, timestamp, path }`.
 * Known application codes are preserved; parse/validation failures map to `BAD_REQUEST`
 * in production; any other (unknown/internal) error is masked to `INTERNAL_SERVER_ERROR`
 * outside development while the full trace stays in server logs.
 */
export function formatGraphQLError(formatted: GraphQLFormattedError): GraphQLFormattedError {
  const input = formatted as unknown as FormattedLike;
  const extensions: ExtensionsLike = (formatted.extensions as ExtensionsLike | undefined) ?? {};
  const code = typeof extensions.code === 'string' ? extensions.code : '';

  let shownCode = code;
  let message = input.message;
  let stacktrace: unknown = extensions.stacktrace;

  if ((KNOWN_CODES as readonly string[]).includes(code)) {
    // preserved verbatim
  } else if (PARSE_OR_VALIDATION.includes(code)) {
    shownCode = isProduction() ? BAD_REQUEST : code;
  } else {
    shownCode = INTERNAL_SERVER_ERROR;
    if (isProduction()) {
      message = 'Internal server error';
      stacktrace = undefined;
    }
  }

  const cleanExtensions: Record<string, unknown> = { ...extensions };
  delete cleanExtensions.stacktrace;
  if (stacktrace !== undefined) {
    cleanExtensions.stacktrace = stacktrace;
  }

  const result = {
    ...formatted,
    message,
    path: input.path ?? [],
    extensions: { ...cleanExtensions, code: shownCode, timestamp: new Date().toISOString() },
  } as GraphQLFormattedError & { extensions?: ExtensionsLike };
  return result;
}