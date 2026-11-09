import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { Variables } from 'graphql-request';
import { getAccessToken } from '../auth/supabase';
import { apiRequest } from './client';
import { emitUnauthenticated } from './notify-unauthenticated';
import { errorMessage } from './error-surface';
import { fail, type ActionResult } from '../types/result';

/**
 * Authenticated GraphQL call for module services (feature 024).
 * Reads the live Supabase bearer token from the browser and delegates to the
 * typed transport. A missing session emits the global unauthenticated signal so
 * the session provider can clear state and route to `/login`.
 */
export async function apiRequestAuthed<
  TResult,
  TVariables extends Variables = Variables,
>(document: TypedDocumentNode<TResult, TVariables>, variables: TVariables): Promise<ActionResult<TResult>> {
  const token = await getAccessToken();
  if (!token) {
    emitUnauthenticated();
    return fail('UNAUTHENTICATED', errorMessage('UNAUTHENTICATED'));
  }
  return apiRequest(document, variables, { token });
}
