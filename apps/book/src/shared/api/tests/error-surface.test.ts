import { describe, expect, it } from 'vitest';
import { errorMessage, errorSurface } from '../error-surface';
import type { ErrorCode } from '../../types/result';

describe('error-surface (feature 012 — centralized classification)', () => {
  it('routes UNAUTHENTICATED to the global session handler', () => {
    expect(errorSurface('UNAUTHENTICATED')).toBe('session');
  });

  it('treats connection and not-found as transient alerts', () => {
    expect(errorSurface('STATE_ERROR')).toBe('transient');
    expect(errorSurface('NOT_FOUND')).toBe('transient');
  });

  it('treats validation, conflict and taken identifiers as inline', () => {
    expect(errorSurface('VALIDATION_ERROR')).toBe('inline');
    expect(errorSurface('CONFLICT')).toBe('inline');
    expect(errorSurface('EMAIL_TAKEN')).toBe('inline');
    expect(errorSurface('SLUG_TAKEN')).toBe('inline');
    expect(errorSurface('FORBIDDEN')).toBe('inline');
  });

  it('never returns the raw provider text (English/technical)', () => {
    const codes: ErrorCode[] = [
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'STATE_ERROR',
      'EMAIL_TAKEN',
      'SLUG_TAKEN',
    ];
    for (const code of codes) {
      const message = errorMessage(code);
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(/unauthenticated|not found|forbidden|error de la api/i);
    }
  });
});
