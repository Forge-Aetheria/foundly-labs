/**
 * Pure public-URL (slug) rules for Foundly Book tenants.
 * No framework, storage or brand-color imports (constraint C2).
 */

/** 3–40 chars, lowercase latin, no leading/trailing hyphen. */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

/** System surfaces that a business can never claim (FR-006). */
export const RESERVED_SLUGS: readonly string[] = [
  'admin',
  'onboarding',
  'api',
  'www',
  'app',
  'public',
  'static',
  'assets',
];

export type SlugReason = 'format' | 'reserved' | 'taken';

export type SlugValidation = { ok: true } | { ok: false; reason: SlugReason };

/** Lowercase, strip accents, collapse separators into hyphens, trim edges. */
export function normalizeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate an as-entered slug. `taken` is an optional iterable of existing
 * tenant slugs used to reject duplicates (FR-008, FR-014).
 */
export function validateSlug(input: string, taken?: Iterable<string>): SlugValidation {
  if (!SLUG_PATTERN.test(input)) return { ok: false, reason: 'format' };
  if (RESERVED_SLUGS.includes(input)) return { ok: false, reason: 'reserved' };
  if (taken) {
    for (const existing of taken) {
      if (existing.toLowerCase() === input) return { ok: false, reason: 'taken' };
    }
  }
  return { ok: true };
}

/** Derive a candidate slug from a commercial name (FR-009). */
export function suggestSlug(commercialName: string): string {
  return normalizeSlug(commercialName).slice(0, 40);
}
