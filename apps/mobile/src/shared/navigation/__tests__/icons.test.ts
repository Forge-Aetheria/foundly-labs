import { Ionicons } from '@expo/vector-icons';
import { NAVIGATION_MODULES } from '../modules';

const HEADER_ACTIONS = ['notifications-outline', 'open-outline', 'log-out-outline'] as const;

describe('navigation icon integrity', () => {
  it('uses valid Ionicons glyphs for every module', () => {
    const glyphs = Ionicons.glyphMap as Record<string, number>;

    for (const module of NAVIGATION_MODULES) {
      expect(glyphs[module.icon]).toBeDefined();
    }
  });

  it('uses valid Ionicons glyphs for header and drawer actions', () => {
    const glyphs = Ionicons.glyphMap as Record<string, number>;

    for (const icon of HEADER_ACTIONS) {
      expect(glyphs[icon]).toBeDefined();
    }
  });
});
