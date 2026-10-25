import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NAVIGATION_MODULES } from '../modules';

const DRAWER_DIR = join(__dirname, '../../../../app/(drawer)');

describe('drawer route files', () => {
  it('has a file for every registered module', () => {
    for (const module of NAVIGATION_MODULES) {
      expect(existsSync(join(DRAWER_DIR, `${module.id}.tsx`))).toBe(true);
    }
  });

  it('has an index redirect and no legacy tab group', () => {
    expect(existsSync(join(DRAWER_DIR, 'index.tsx'))).toBe(true);
    expect(existsSync(join(__dirname, '../../../../app/(tabs)'))).toBe(false);
  });
});
