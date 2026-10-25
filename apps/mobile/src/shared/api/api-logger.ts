const PREFIX = '[foundly-api]';
let configLogged = false;

interface ErrorLike {
  name?: string;
  message?: string;
  code?: string;
  info?: unknown;
  stack?: string;
  cause?: unknown;
  response?: {
    status?: number;
    statusText?: string;
    errors?: unknown;
  };
  request?: {
    query?: unknown;
    variables?: unknown;
  };
}

function describeError(error: unknown): Record<string, unknown> {
  const value = error as ErrorLike | null;

  return {
    constructor: value?.constructor?.name,
    name: value?.name ?? typeof error,
    code: value?.code,
    message: value?.message || String(error) || '(sin mensaje)',
    info: value?.info,
    status: value?.response?.status,
    statusText: value?.response?.statusText,
    graphQLErrors: value?.response?.errors,
    cause:
      value?.cause instanceof Error
        ? { name: value.cause.name, message: value.cause.message }
        : value?.cause,
  };
}

export function logApiConfigOnce(apiUrl: string): void {
  if (configLogged) return;
  configLogged = true;

  console.log(`${PREFIX} config`, {
    apiUrl,
    graphqlUrl: `${apiUrl}/graphql`,
    timeoutMs: 10_000,
  });

  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(apiUrl)) {
    console.warn(
      `${PREFIX} La API apunta a localhost. En un dispositivo físico usa la IP de tu Mac o una URL pública; localhost apunta al propio dispositivo.`,
    );
  }
}

export function logApiRequest(url: string, hasToken: boolean, variables: unknown): void {
  const variableKeys =
    variables && typeof variables === 'object' ? Object.keys(variables as object) : [];

  console.log(`${PREFIX} → POST ${url}`, {
    hasToken,
    variableKeys,
    timeoutMs: 10_000,
  });
}

export function logApiSuccess(url: string, durationMs: number): void {
  console.log(`${PREFIX} ← OK ${url} (${durationMs}ms)`);
}

export function logApiFailure(url: string, durationMs: number, error: unknown): void {
  const details = describeError(error);
  const summary = [details.constructor, details.code, details.message].filter(Boolean).join(' | ');

  console.error(`${PREFIX} ✖ ${url} (${durationMs}ms) ${summary}`);
  console.error(`${PREFIX} detalle del error`, details);
}
