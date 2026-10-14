import { afterEach, describe, expect, it, vi } from 'vitest';
import { AVATAR_RULE, COVER_RULE, checkImage } from '../utils/image-rules';

interface Dims {
  width: number;
  height: number;
}

let dims: Dims | null = null;

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin = '';
  naturalWidth = 0;
  naturalHeight = 0;
  set src(_value: string) {
    if (dims) {
      this.naturalWidth = dims.width;
      this.naturalHeight = dims.height;
      queueMicrotask(() => this.onload?.());
    } else {
      queueMicrotask(() => this.onerror?.());
    }
  }
}

describe('image rules (feature 016, US4)', () => {
  vi.stubGlobal('Image', FakeImage as unknown as typeof Image);

  afterEach(() => {
    dims = null;
  });

  it('accepts a square logo within tolerance', async () => {
    dims = { width: 512, height: 512 };
    expect(await checkImage('https://x/logo.png', AVATAR_RULE)).toEqual({ ok: true, measured: true });
  });

  it('blocks a non-square logo with a clear message', async () => {
    dims = { width: 512, height: 256 };
    const result = await checkImage('https://x/logo.png', AVATAR_RULE);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/cuadrada/);
  });

  it('accepts a banner cover', async () => {
    dims = { width: 1200, height: 400 };
    expect(await checkImage('https://x/cover.png', COVER_RULE)).toEqual({ ok: true, measured: true });
  });

  it('degrades to guidance when the image cannot be measured', async () => {
    dims = null;
    expect(await checkImage('https://x/unknown.png', AVATAR_RULE)).toEqual({
      ok: true,
      measured: false,
    });
  });
});
