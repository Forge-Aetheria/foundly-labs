import type { BookingDraft } from '../../../shared/types/tenancy';

/**
 * Local-first wizard draft seam (contracts/onboarding.contract.md).
 * Persists drafts on the client so a reload or connectivity drop never loses
 * onboarding data (FR-013). In Node/test environments it falls back to memory.
 */

const KEY_PREFIX = 'foundly.onboarding.draft.';
const memory = new Map<string, BookingDraft>();

function storage(): Storage | null {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? window.localStorage
    : null;
}

function draftKey(draftId: string): string {
  return `${KEY_PREFIX}${draftId}`;
}

export function saveDraft(draft: BookingDraft): void {
  const local = storage();
  if (local) {
    local.setItem(draftKey(draft.draftId), JSON.stringify(draft));
  } else {
    memory.set(draft.draftId, draft);
  }
}

export function loadDraft(draftId: string): BookingDraft | null {
  const local = storage();
  const raw = local ? local.getItem(draftKey(draftId)) : (memory.get(draftId) ?? null);
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? (JSON.parse(raw) as BookingDraft) : raw;
  } catch {
    return null;
  }
}

export function clearDraft(draftId: string): void {
  const local = storage();
  if (local) {
    local.removeItem(draftKey(draftId));
  }
  memory.delete(draftId);
}

/** The draft that a returning visitor should resume. */
const ACTIVE_KEY = 'foundly.onboarding.activeDraftId';

export function loadActiveDraftId(): string | null {
  const local = storage();
  return local ? local.getItem(ACTIVE_KEY) : null;
}

export function saveActiveDraftId(draftId: string): void {
  const local = storage();
  if (local) local.setItem(ACTIVE_KEY, draftId);
}

export function clearActiveDraftId(): void {
  const local = storage();
  if (local) local.removeItem(ACTIVE_KEY);
}
