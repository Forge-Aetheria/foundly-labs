import {
  request,
  type RequestDocument,
  type RequestExtendedOptions,
  type Variables,
} from 'graphql-request';
import { env } from '../config/env';
import {
  logApiConfigOnce,
  logApiFailure,
  logApiRequest,
  logApiSuccess,
} from './api-logger';
import { errorMessage } from './error-surface';
import { emitUnauthenticated } from './notify-unauthenticated';
import { ok, type ActionResult, type ErrorCode } from './result';

const REQUEST_TIMEOUT_MS = 10_000;

export interface ApiRequestOptions {
  token?: string | null;
}

interface GraphQLErrorLike {
  message?: string;
  extensions?: { code?: string };
}

interface ClientErrorLike {
  response?: { errors?: GraphQLErrorLike[] };
  message?: string;
}

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

function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(ms)
    : undefined;
}

export function mapActionError(error: unknown): {
  ok: false;
  code: ErrorCode;
  message: string;
} {
  const clientError = error as ClientErrorLike | null;
  const code = clientError?.response?.errors?.[0]?.extensions?.code;
  const mapped = mapErrorCode(code);
  if (mapped === 'UNAUTHENTICATED') {
    emitUnauthenticated();
  }
  if (mapped) {
    return { ok: false, code: mapped, message: errorMessage(mapped) };
  }
  return { ok: false, code: 'NETWORK_ERROR', message: errorMessage('NETWORK_ERROR') };
}

export async function apiRequest<TResult, TVariables extends Variables = Variables>(
  document: RequestDocument,
  variables: TVariables,
  options: ApiRequestOptions = {},
): Promise<ActionResult<TResult>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const url = `${env.apiUrl}/graphql`;
  const startedAt = Date.now();
  logApiConfigOnce(env.apiUrl);
  logApiRequest(url, Boolean(options.token), variables);
  try {
    const options = {
      url,
      document,
      variables,
      requestHeaders: headers,
      signal: timeoutSignal(REQUEST_TIMEOUT_MS),
    } as unknown as RequestExtendedOptions<TVariables, TResult>;
    const data = await request<TResult, TVariables>(options);
    logApiSuccess(url, Date.now() - startedAt);
    return ok(data);
  } catch (error) {
    logApiFailure(url, Date.now() - startedAt, error);
    return mapActionError(error);
  }
}
