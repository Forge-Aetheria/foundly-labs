import { describe, expect, it } from 'vitest';
import { canTransition, isTerminal } from '../utils/lifecycle';

describe('appointment lifecycle (data-model §7)', () => {
  it('allows the documented transitions', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'checked-in')).toBe(true);
    expect(canTransition('checked-in', 'completed')).toBe(true);
    expect(canTransition('pending', 'cancelled')).toBe(true);
    expect(canTransition('confirmed', 'no-show')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('pending', 'completed')).toBe(false);
    expect(canTransition('completed', 'confirmed')).toBe(false);
    expect(canTransition('cancelled', 'pending')).toBe(false);
  });

  it('treats completed, cancelled and no-show as terminal', () => {
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
    expect(isTerminal('no-show')).toBe(true);
    expect(isTerminal('pending')).toBe(false);
  });
});
