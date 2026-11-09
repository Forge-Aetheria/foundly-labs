import { GraphQLError } from 'graphql';

/** Stable GraphQL error for a missing, invalid or expired identity. */
export function unauthError(): GraphQLError {
  return new GraphQLError('Unauthenticated', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

/** Stable GraphQL error for an authenticated identity without permission. */
export function forbiddenError(message = 'Forbidden'): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'FORBIDDEN' },
  });
}
