import { randomUUID } from 'node:crypto';
import type { ApolloServerPlugin } from '@apollo/server';
import type { ApolloDriverConfig } from '@nestjs/apollo';
import type { GraphQLError } from 'graphql';
import type { FoundlyLogger } from '../shared/logger/logger';
import { createLogger } from '../shared/logger/logger';

/** The exact plugins-array type expected by `GraphQLModule.forRoot<ApolloDriverConfig>`. */
export type GraphQlPlugins = NonNullable<ApolloDriverConfig['plugins']>;

interface LoggedRequest {
  operationName?: string;
  http?: { method?: string; url?: string } | undefined;
}

interface ExceptionLike {
  stacktrace?: string[];
  message?: string;
}

/**
 * Apollo plugin that records the GraphQL request lifecycle as structured records:
 * request start, resolution result (operation, duration, error count) and each error
 * with its full stack — always server-side.
 */
export function requestLifecyclePlugin(
  logger: FoundlyLogger = createLogger(),
): ApolloServerPlugin<Record<string, never>> {
  return {
    async requestDidStart(service) {
      const request = service.request as LoggedRequest;
      const requestId = randomUUID();
      const operation = request.operationName ?? 'anonymous';
      const start = Date.now();
      const method = request.http?.method ?? 'POST';
      const path = request.http?.url ?? '/graphql';

      logger.info({ requestId, operation, method, path }, 'graphql request start');

      return {
        async didEncounterErrors({ errors }) {
          for (const error of errors) {
            const exception = error.extensions?.exception as ExceptionLike | undefined;
            const message = exception?.message ?? error.message;
            const stack = exception?.stacktrace?.join('\n') ?? (error as GraphQLError).originalError?.stack;
            logger.error(
              { requestId, operation, err: { message, stack } },
              'graphql error encountered',
            );
          }
        },
        async willSendResponse({ errors }) {
          const durationMs = Date.now() - start;
          const errorCount = errors?.length ?? 0;
          if (errorCount > 0) {
            logger.error({ requestId, operation, durationMs, errorCount }, 'graphql request failed');
          } else {
            logger.info({ requestId, operation, durationMs, errorCount }, 'graphql request completed');
          }
        },
      };
    },
  };
}

/** Lifecycle plugin(s) typed for `GraphQLModule.forRoot<ApolloDriverConfig>` wiring. */
export function buildRequestPlugins(logger: FoundlyLogger = createLogger()): GraphQlPlugins {
  return [requestLifecyclePlugin(logger)] as unknown as GraphQlPlugins;
}