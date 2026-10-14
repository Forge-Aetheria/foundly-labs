import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryReviewsStore, type MemoryReviewsStore } from './reviews.test-store';
import { ReviewsService } from './reviews.service';
import { ReviewState, type AddReviewInput } from './reviews.types';

const T1 = 'tenant-1';
const T2 = 'tenant-2';
const owner = { tenantId: T1 };
const other = { tenantId: T2 };

function input(overrides: Partial<AddReviewInput> = {}): AddReviewInput {
  return { tenantId: T1, author: 'Lucía', rating: 5, comment: 'Genial', ...overrides };
}

function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  return expect(promise).rejects.toThrowError(expect.objectContaining({ extensions: { code } }));
}

describe('ReviewsService (013 reviews + 015 moderation)', () => {
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

  it('creates submissions as pending and hides them until approved', async () => {
    const created = await service.add(input({ rating: 5 }));
    expect(created.state).toBe('pending');
    expect(await service.summary({ tenantSlug: 'estudio-ana' })).toEqual({
      items: [],
      average: null,
      count: 0,
    });

    await service.setState(owner, created.id, ReviewState.approved);
    const summary = await service.summary({ tenantSlug: 'estudio-ana' });
    expect(summary.count).toBe(1);
    expect(summary.average).toBe(5);
    expect(summary.items[0]?.state).toBe('approved');
  });

  it('computes the aggregate over approved reviews only', async () => {
    const a = await service.add(input({ rating: 5 }));
    const b = await service.add(input({ rating: 3, author: 'Luis', comment: 'Bien' }));

    await service.setState(owner, a.id, ReviewState.approved);
    expect((await service.summary({ tenantId: T1 })).count).toBe(1);

    await service.setState(owner, b.id, ReviewState.rejected);
    const summary = await service.summary({ tenantId: T1 });
    expect(summary.count).toBe(1);
    expect(summary.average).toBe(5);
  });

  it('isolates tenants', async () => {
    const a = await service.add(input({ tenantId: T1 }));
    await service.setState(owner, a.id, ReviewState.approved);
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

  describe('moderation (015)', () => {
    it('admin read returns every state and filters by state', async () => {
      const a = await service.add(input());
      const b = await service.add(input({ author: 'Luis', comment: 'Bien' }));
      await service.setState(owner, b.id, ReviewState.rejected);

      const all = await service.listForAdmin(owner);
      expect(all.map((row) => row.id).sort()).toEqual([a.id, b.id].sort());

      const pending = await service.listForAdmin(owner, ReviewState.pending);
      expect(pending.map((row) => row.id)).toEqual([a.id]);

      const rejected = await service.listForAdmin(owner, ReviewState.rejected);
      expect(rejected.map((row) => row.id)).toEqual([b.id]);
    });

    it('admin read is tenant-scoped and rejects anonymous', async () => {
      await service.add(input({ tenantId: T1 }));
      expect(await service.listForAdmin(other)).toEqual([]);
      await expectCode(service.listForAdmin(undefined), 'UNAUTHENTICATED');
      await expectCode(service.listForAdmin({}), 'UNAUTHENTICATED');
    });

    it('approves/rejects idempotently and rejects pending', async () => {
      const a = await service.add(input());
      expect((await service.setState(owner, a.id, ReviewState.approved)).state).toBe('approved');
      expect((await service.setState(owner, a.id, ReviewState.approved)).state).toBe('approved');
      expect((await service.setState(owner, a.id, ReviewState.rejected)).state).toBe('rejected');
      await expectCode(service.setState(owner, a.id, ReviewState.pending), 'VALIDATION_ERROR');
    });

    it('moderation of a foreign or missing id is NOT_FOUND and leaves it intact', async () => {
      const a = await service.add(input());
      await expectCode(service.setState(other, a.id, ReviewState.approved), 'NOT_FOUND');
      await expectCode(service.setState(owner, 'missing', ReviewState.approved), 'NOT_FOUND');
      expect((await service.listForAdmin(owner))[0]?.state).toBe('pending');
    });

    it('moderation rejects anonymous', async () => {
      const a = await service.add(input());
      await expectCode(service.setState(undefined, a.id, ReviewState.approved), 'UNAUTHENTICATED');
      await expectCode(service.remove(undefined, a.id), 'UNAUTHENTICATED');
    });

    it('deletes an owned review and rejects foreign or missing ids', async () => {
      const a = await service.add(input());
      await expectCode(service.remove(other, a.id), 'NOT_FOUND');
      expect(await service.remove(owner, a.id)).toBe(true);
      await expectCode(service.remove(owner, a.id), 'NOT_FOUND');
      expect(await service.listForAdmin(owner)).toEqual([]);
    });
  });
});
