const ABSOLUTE_URL = /^https?:\/\//i;

export function buildPublicPageUrl(
  baseUrl: string | null | undefined,
  slug: string | null | undefined,
): string | null {
  if (!baseUrl || !slug) return null;

  const base = baseUrl.trim().replace(/\/+$/, '');
  const path = slug.trim().replace(/^\/+|\/+$/g, '');
  if (!ABSOLUTE_URL.test(base) || path.length === 0) return null;

  const url = `${base}/${path}`;
  return ABSOLUTE_URL.test(url) ? url : null;
}
