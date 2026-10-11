import { beforeEach, describe, expect, it } from 'vitest';
import type { BookingDraft } from '../../../shared/types/tenancy';
import { clearDraft, loadDraft, saveDraft } from '../utils/draft';

const draft: BookingDraft = {
  draftId: 'd-1',
  step: 2,
  account: { fullName: 'Raúl Gómez', email: 'raul@acme.dev', password: 'secreto123' },
  business: null,
  setup: null,
};

describe('onboarding draft seam (FR-013, local-first)', () => {
  beforeEach(() => {
    clearDraft('d-1');
  });

  it('saves and loads a draft (survives a reload)', () => {
    saveDraft(draft);
    expect(loadDraft('d-1')).toEqual(draft);
  });

  it('returns null when the draft is missing', () => {
    expect(loadDraft('d-missing')).toBeNull();
  });

  it('clears a draft after consumption', () => {
    saveDraft(draft);
    clearDraft('d-1');
    expect(loadDraft('d-1')).toBeNull();
  });
});
