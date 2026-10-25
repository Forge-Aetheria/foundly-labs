import { buildPublicPageUrl } from '../public-page';

describe('public page URL', () => {
  it('joins a valid base URL and slug', () => {
    expect(buildPublicPageUrl('https://book.foundlylabs.com', 'estudio-ana')).toBe(
      'https://book.foundlylabs.com/estudio-ana',
    );
    expect(buildPublicPageUrl('https://book.foundlylabs.com/', '/estudio-ana/')).toBe(
      'https://book.foundlylabs.com/estudio-ana',
    );
  });

  it('returns null when the configuration is incomplete', () => {
    expect(buildPublicPageUrl(null, 'estudio-ana')).toBeNull();
    expect(buildPublicPageUrl('https://book.foundlylabs.com', null)).toBeNull();
    expect(buildPublicPageUrl('https://book.foundlylabs.com', '   ')).toBeNull();
  });

  it('rejects non-http(s) bases', () => {
    expect(buildPublicPageUrl('ftp://book.foundlylabs.com', 'estudio-ana')).toBeNull();
    expect(buildPublicPageUrl('javascript:alert(1)', 'estudio-ana')).toBeNull();
  });
});
