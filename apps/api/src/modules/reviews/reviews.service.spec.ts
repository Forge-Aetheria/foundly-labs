import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryReviewsStore, type MemoryReviewsStore } from './reviews.test-store';
import { ReviewsService } from './reviews.service';
import type { AddReviewInput } from './reviews.types';

const T1 = 'tenant-1';
const T2 = 'tenant-2';

function input(overrides: Partial<AddReviewInput> = {}): AddReviewInput {
  return { tenantId: T1, author: 'Lucía', rating: 5, comment: 'Genial', ...overrides };
}

function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  return expect(promise).rejects.toThrowError(expect.objectContaining({ extensions: { code } }));
}

describe('ReviewsService (013-profile-policies-reviews)', () => {
  let store: MemoryReviewsStore;
  let service: ReviewsService;

  beforeEach(() => {
    store = createMemoryReviewsStore();
    store.tenantBySlug('estudio-ana', T1);
    service = new ReviewsService(store);
  });

  it('returns an empty summary for empty and unknown businesses', async () => {
    expect(await service.summary({ tenantId: T1 })).toEqual({ items: [], average: null, count: 0 });
    expect(await service.summary({ tenantSlug: 'unknown' })).toEqual({
      items: [],
      average: null,
      count: 0,
    });
  });

  it('adds reviews, lists them and computes the aggregate', async () => {
    await service.add(input({ rating: 5 }));
    await service.add(input({ rating: 3, author: 'Luis', comment: 'Bien' }));

    const summary = await service.summary({ tenantSlug: 'estudio-ana' });
    expect(summary.count).toBe(2);
    expect(summary.average).toBe(4);
    expect(summary.items).toHaveLength(2);
  });

  it('isolates tenants', async () => {
    await service.add(input({ tenantId: T1 }));
    expect((await service.summary({ tenantId: T2 })).count).toBe(0);
  });

  it('validates rating, author and comment', async () => {
    await expectCode(service.add(input({ rating: 9 })), 'VALIDATION_ERROR');
    await expectCode(service.add(input({ rating: 0 })), 'VALIDATION_ERROR');
    await expectCode(service.add(input({ author: '   ' })), 'VALIDATION_ERROR');
    await expectCode(service.add(input({ comment: '' })), 'VALIDATION_ERROR');
  });

  it('rejects an unknown business with NOT_FOUND', async () => {
    await expectCode(service.add(input({ tenantId: null, tenantSlug: 'no-existe' })), 'NOT_FOUND');
  });
});
