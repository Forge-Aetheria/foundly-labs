import { describe, expect, it } from 'vitest';
import { SUPPORT_CHANNELS, SUPPORT_FAQS, SUPPORT_INTRO } from '../support-content';

describe('support content', () => {
  it('has intro and complete FAQ entries', () => {
    expect(SUPPORT_INTRO.trim().length).toBeGreaterThan(0);
    expect(SUPPORT_FAQS.length).toBeGreaterThan(0);
    for (const item of SUPPORT_FAQS) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses safe contact links', () => {
    expect(SUPPORT_CHANNELS.length).toBeGreaterThan(0);
    for (const channel of SUPPORT_CHANNELS) {
      expect(/^(https:\/\/|mailto:)/i.test(channel.href)).toBe(true);
    }
  });
});
