import { describe, expect, it } from 'vitest';
import {
  ABOUT_DESCRIPTION,
  ABOUT_LEGAL_LINKS,
  ABOUT_TAGLINE,
  BOOK_APP_VERSION,
} from '../about-content';

describe('about content', () => {
  it('has product copy and version', () => {
    expect(ABOUT_TAGLINE.trim().length).toBeGreaterThan(0);
    expect(ABOUT_DESCRIPTION.trim().length).toBeGreaterThan(0);
    expect(BOOK_APP_VERSION.trim().length).toBeGreaterThan(0);
  });

  it('uses only https legal links', () => {
    expect(ABOUT_LEGAL_LINKS.length).toBeGreaterThan(0);
    for (const link of ABOUT_LEGAL_LINKS) {
      expect(link.href.startsWith('https://')).toBe(true);
    }
  });
});
