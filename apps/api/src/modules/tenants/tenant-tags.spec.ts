import { describe, expect, it } from 'vitest';
import { sanitizeTag, sanitizeTags } from './tenant-tags';

describe('tenant tag sanitization', () => {
  it('applies Title Case and removes invalid characters', () => {
    expect(sanitizeTag('  corte   de PELO!!  ')).toBe('Corte De Pelo');
    expect(sanitizeTag('cuidado-íntimo')).toBe('Cuidado-íntimo');
    expect(sanitizeTag('###')).toBe('');
  });

  it('trims, deduplicates case-insensitively and bounds the tag list', () => {
    expect(sanitizeTags([' Color ', 'color', 'CORTE', '', '  '])).toEqual(['Color', 'Corte']);
  });

  it('limits each tag to 30 characters and the list to 20 tags', () => {
    const long = sanitizeTag('a'.repeat(80));
    expect(long).toHaveLength(30);
    const tags = Array.from({ length: 25 }, (_, index) => `tag ${index}`);
    expect(sanitizeTags(tags)).toHaveLength(20);
    expect(sanitizeTags(tags)[0]).toBe('Tag 0');
  });
});
