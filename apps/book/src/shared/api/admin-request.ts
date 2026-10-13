import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { Variables } from 'graphql-request';
import { redirect } from 'next/navigation';
import { SESSION_EXPIRED_ROUTE } from '../auth/authConstants';
import { getAccessToken } from '../auth/authServer';
import { apiRequest } from './client';
import { errorSurface } from './error-surface';
import type { ActionResult } from '../types/result';

/**
 * Authenticated GraphQL call for the admin workspace (feature 012 — centralized
 * error handling). Server-only.
 *
 * - Injects the live Supabase bearer token.
 * - A missing token (session drift) or an API `UNAUTHENTICATED` response is a
 *   SESSION problem, never inline text: it routes through the global
 *   session-expiry handler (clears cookies → `/login`).
 * - Transient/inline errors are returned to the caller (already localized by
 *   `apiRequest`/`mapActionError`).
 */
export async function apiRequestAdmin<TResult, TVariables extends Variables = Variables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables: TVariables,
): Promise<ActionResult<TResult>> {
  const token = await getAccessToken();
  if (!token) {
    redirect(SESSION_EXPIRED_ROUTE);
  }
  const result = await apiRequest(document, variables, { token });
  if (!result.ok && errorSurface(result.error.code) === 'session') {
    redirect(SESSION_EXPIRED_ROUTE);
  }
  return result;
}
