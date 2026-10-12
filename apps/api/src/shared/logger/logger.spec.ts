import { describe, expect, it } from 'vitest';
import { createLogger, createPino } from './logger';

interface Sink {
  lines: string[];
  stream: { write(chunk: string | Uint8Array): boolean };
}

function capture(): Sink {
  const lines: string[] = [];
  return {
    lines,
    stream: {
      write: (chunk: string | Uint8Array): boolean => {
        lines.push(String(chunk));
        return true;
      },
    },
  };
}

describe('FoundlyLogger (009-structured-logging-errors)', () => {
  it('emits structured JSON records with the service base field', () => {
    const sink = capture();
    createLogger({ stream: sink.stream }).log({ requestId: 'r1', operation: 'health' }, 'request start');
    const record = JSON.parse(sink.lines[0] ?? '{}') as Record<string, unknown>;
    expect(record).toMatchObject({ service: 'foundly-api', requestId: 'r1', operation: 'health' });
    expect(typeof record.time).toBe('string');
  });

  it('logs string messages with an optional context', () => {
    const sink = capture();
    createLogger({ stream: sink.stream }).log('resolver finished', 'TenantsResolver');
    const record = JSON.parse(sink.lines[0] ?? '{}') as Record<string, unknown>;
    expect(record.msg).toBe('resolver finished');
    expect(record.context).toBe('TenantsResolver');
  });

  it('logs errors with message and stack', () => {
    const sink = capture();
    createLogger({ stream: sink.stream }).error(new Error('boom'));
    const record = JSON.parse(sink.lines[0] ?? '{}') as Record<string, unknown>;
    expect(record.msg).toBe('boom');
    const err = record.err as { message?: string; stack?: string };
    expect(err?.message).toBe('boom');
    expect(typeof err?.stack).toBe('string');
  });

  it('redacts credentials, tokens and PII from nested objects', () => {
    const sink = capture();
    createLogger({ stream: sink.stream }).log({
      password: 'pw123',
      token: 'tok-abc',
      secret: 's3',
      nested: { apiKey: 'k-9', email: 'u@foundly.dev', phone: '+34-1', fullName: 'Ana' },
    });
    const line = sink.lines[0] ?? '';
    expect(line).not.toContain('pw123');
    expect(line).not.toContain('tok-abc');
    expect(line).not.toContain('k-9');
    expect(line).not.toContain('u@foundly.dev');
    expect(line).not.toContain('+34-1');
    expect(line).not.toContain('Ana');
    expect(line).toContain('[REDACTED]');
  });

  it('redacts the authorization header key', () => {
    const sink = capture();
    const logger = createPino({ stream: sink.stream });
    logger.info({ req: { headers: { authorization: 'Bearer super-secret-token' } } }, 'request');
    const line = sink.lines[0] ?? '';
    expect(line).not.toContain('super-secret-token');
    expect(line).toContain('[REDACTED]');
  });
});