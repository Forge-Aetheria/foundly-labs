import { describe, expect, it } from 'vitest';
import { withTimeout } from '../withTimeout';

describe('withTimeout', () => {
  it('resolves the value when the promise settles first', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000, 'fallback')).resolves.toBe('ok');
  });

  it('resolves the fallback when the promise exceeds the timeout', async () => {
    const never = new Promise<string>(() => {
      /* never settles */
    });
    await expect(withTimeout(never, 10, 'fallback')).resolves.toBe('fallback');
  });

  it('resolves the fallback when the promise rejects', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('boom')), 1000, 'fallback'),
    ).resolves.toBe('fallback');
  });
});
