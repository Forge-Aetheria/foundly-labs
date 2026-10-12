import type { GraphQLFormattedError } from 'graphql';
import { afterEach, describe, expect, it } from 'vitest';
import { formatGraphQLError } from './errors';

function formatted(code: string | undefined, extra: Record<string, unknown> = {}): GraphQLFormattedError {
  return {
    message: 'boom',
    path: ['viewer'],
    extensions: code === undefined ? undefined : { code, ...extra },
  } as unknown as GraphQLFormattedError;
}

afterEach(() => {
  delete process.env.NODE_ENV;
});

describe('formatGraphQLError (009-structured-logging-errors)', () => {
  it('preserves known application codes and adds timestamp + path', () => {
    for (const code of ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'VALIDATION_ERROR']) {
      const out = formatGraphQLError(formatted(code));
      expect(out.extensions?.code).toBe(code);
      expect(typeof out.extensions?.timestamp).toBe('string');
      expect(out.path).toEqual(['viewer']);
    }
  });

  it('defaults path to [] when absent', () => {
    const out = formatGraphQLError({ message: 'no path' } as GraphQLFormattedError);
    expect(out.path).toEqual([]);
    expect(out.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('masks unknown errors in production (generic code, no stack, no detail)', () => {
    process.env.NODE_ENV = 'production';
    const out = formatGraphQLError(
      formatted('SOMETHING_ELSE', { stacktrace: ['at db.query 1'] }),
    );
    expect(out.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
    expect(out.message).toBe('Internal server error');
    expect(JSON.stringify(out)).not.toContain('stacktrace');
    expect(JSON.stringify(out)).not.toContain('at db.query');
  });

  it('reveals unknown errors outside production', () => {
    const out = formatGraphQLError(
      formatted('SOMETHING_ELSE', { stacktrace: ['at db.query 1'] }),
    );
    expect(out.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
    expect(out.message).toBe('boom');
    expect(out.extensions?.stacktrace).toEqual(['at db.query 1']);
  });

  it('maps parse/validation failures to BAD_REQUEST in production', () => {
    process.env.NODE_ENV = 'production';
    for (const code of ['GRAPHQL_PARSE_FAILED', 'GRAPHQL_VALIDATION_FAILED']) {
      const out = formatGraphQLError(formatted(code));
      expect(out.extensions?.code).toBe('BAD_REQUEST');
    }
  });

  it('keeps parse/validation codes outside production', () => {
    const out = formatGraphQLError(formatted('GRAPHQL_VALIDATION_FAILED'));
    expect(out.extensions?.code).toBe('GRAPHQL_VALIDATION_FAILED');
  });
});