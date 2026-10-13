import { describe, expect, it } from 'vitest';
import { normalizeSlug, RESERVED_SLUGS, SLUG_PATTERN, suggestSlug, validateSlug } from '../slug';

describe('tenancy slug rules (contracts/tenancy.contract.md)', () => {
  it('normalizes names into kebab-case slugs', () => {
    expect(normalizeSlug('Estudio Ana')).toBe('estudio-ana');
    expect(normalizeSlug('  Peluquería Mia  ')).toBe('peluqueria-mia');
    expect(normalizeSlug('Café–Bar Z')).toBe('cafe-bar-z');
  });

  it('suggests a candidate from the commercial name', () => {
    expect(suggestSlug('Estudio Ana')).toBe('estudio-ana');
    expect(SLUG_PATTERN.test(suggestSlug('Mi Gran Negocio'))).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(validateSlug('Mi Negocio').ok).toBe(false);
    expect(validateSlug('-admin').ok).toBe(false);
    expect(validateSlug('admin-').ok).toBe(false);
    expect(validateSlug('ab').ok).toBe(false);
    expect(validateSlug('a'.repeat(41)).ok).toBe(false);
  });

  it('accepts valid formats', () => {
    expect(validateSlug('estudio-ana')).toEqual({ ok: true });
    expect(validateSlug('mi-negocio-2026')).toEqual({ ok: true });
  });

  it('rejects reserved words (FR-006)', () => {
    for (const reserved of RESERVED_SLUGS) {
      expect(validateSlug(reserved).ok).toBe(false);
      expect(validateSlug(reserved)).toEqual({ ok: false, reason: 'reserved' });
    }
  });

  it('rejects taken slugs only when provided (FR-014)', () => {
    expect(validateSlug('estudio-ana', ['estudio-ana'])).toEqual({
      ok: false,
      reason: 'taken',
    });
    expect(validateSlug('estudio-ana')).toEqual({ ok: true });
  });

  it('exposes the documented reserved list', () => {
    expect([...RESERVED_SLUGS]).toEqual([
      'admin',
      'onboarding',
      'api',
      'www',
      'app',
      'public',
      'static',
      'assets',
    ]);
  });
});
