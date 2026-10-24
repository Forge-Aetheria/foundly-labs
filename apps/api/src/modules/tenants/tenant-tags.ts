const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 30;

function titleCaseWord(word: string): string {
  return word.charAt(0).toLocaleUpperCase('es') + word.slice(1).toLocaleLowerCase('es');
}

/** Clean a single tag: strip invalid chars, collapse spaces and apply Title Case. */
export function sanitizeTag(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_TAG_LENGTH)
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(titleCaseWord)
    .join(' ');
}

/** Normalize, deduplicate and bound the tags submitted by a tenant. */
export function sanitizeTags(tags: readonly string[] | null | undefined): string[] {
  if (!tags?.length) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== 'string') continue;
    const clean = sanitizeTag(raw);
    if (!clean) continue;
    const key = clean.toLocaleLowerCase('es');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
    if (result.length >= MAX_TAGS) break;
  }
  return result;
}
