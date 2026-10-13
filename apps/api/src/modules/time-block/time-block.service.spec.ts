import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryTimeBlockStore, type MemoryTimeBlockStore } from './time-block.test-store';
import { TimeBlockService } from './time-block.service';
import type { AddTimeBlockInput } from './time-block.types';

const T1 = 'tenant-1';
const T2 = 'tenant-2';

function scoped(tenantId?: string): { tenantId?: string } {
  return { tenantId };
}

function input(overrides: Partial<AddTimeBlockInput> = {}): AddTimeBlockInput {
  return {
    startAt: '2026-12-24T09:00:00.000Z',
    endAt: '2026-12-24T18:00:00.000Z',
    ...overrides,
  } as AddTimeBlockInput;
}

function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  return expect(promise).rejects.toThrowError(expect.objectContaining({ extensions: { code } }));
}

describe('TimeBlockService (014-availability-time-blocks)', () => {
  let store: MemoryTimeBlockStore;
  let service: TimeBlockService;

  beforeEach(() => {
    store = createMemoryTimeBlockStore();
    store.tenantBySlug('estudio-ana', T1);
    store.addSpecialist('res-ana', T1);
    service = new TimeBlockService(store);
  });

  it('lists an empty list by id, by slug and for an unknown slug', async () => {
    expect(await service.list({ tenantId: T1 })).toEqual([]);
    expect(await service.list({ tenantSlug: 'estudio-ana' })).toEqual([]);
    expect(await service.list({ tenantSlug: 'unknown' })).toEqual([]);
  });

  it('orders by start and filters by specialist (specialist + business-wide)', async () => {
    const businessWide = await service.add(
      scoped(T1),
      input({ startAt: '2026-12-24T09:00:00.000Z', endAt: '2026-12-24T10:00:00.000Z' }),
    );
    const specialist = await service.add(
      scoped(T1),
      input({ specialistId: 'res-ana', startAt: '2026-12-25T09:00:00.000Z', endAt: '2026-12-25T10:00:00.000Z' }),
    );
    store.addSpecialist('res-other', T1);
    const other = await service.add(
      scoped(T1),
      input({ specialistId: 'res-other', startAt: '2026-12-26T09:00:00.000Z', endAt: '2026-12-26T10:00:00.000Z' }),
    );

    const all = await service.list({ tenantId: T1 });
    expect(all.map((row) => row.id)).toEqual([businessWide.id, specialist.id, other.id]);

    const forSpecialist = await service.list({ tenantId: T1 }, 'res-ana');
    expect(forSpecialist.map((row) => row.id).sort()).toEqual([businessWide.id, specialist.id].sort());
  });

  it('isolates tenants', async () => {
    await service.add(scoped(T1), input());
    expect(await service.list({ tenantId: T2 })).toEqual([]);
  });

  it('rejects anonymous and non-tenant-bound adds', async () => {
    await expectCode(service.add(undefined, input()), 'UNAUTHENTICATED');
    await expectCode(service.add({}, input()), 'UNAUTHENTICATED');
  });

  it('rejects an invalid range and malformed instants', async () => {
    await expectCode(
      service.add(scoped(T1), input({ startAt: '2026-12-24T18:00:00.000Z', endAt: '2026-12-24T09:00:00.000Z' })),
      'VALIDATION_ERROR',
    );
    await expectCode(service.add(scoped(T1), input({ startAt: 'not-a-date' })), 'VALIDATION_ERROR');
    await expectCode(service.add(scoped(T1), input({ startAt: '' })), 'VALIDATION_ERROR');
  });

  it('rejects a specialist that does not belong to the tenant', async () => {
    await expectCode(service.add(scoped(T1), input({ specialistId: 'res-other' })), 'VALIDATION_ERROR');
  });

  it('rejects an over-long reason', async () => {
    await expectCode(service.add(scoped(T1), input({ reason: 'x'.repeat(201) })), 'VALIDATION_ERROR');
  });

  it('removes owned blocks and rejects foreign / anonymous removals', async () => {
    const block = await service.add(scoped(T1), input());
    await expectCode(service.remove(scoped(T2), block.id), 'NOT_FOUND');
    expect((await service.list({ tenantId: T1 })).length).toBe(1);
    await expectCode(service.remove(undefined, block.id), 'UNAUTHENTICATED');
    expect(await service.remove(scoped(T1), block.id)).toBe(true);
    await expectCode(service.remove(scoped(T1), block.id), 'NOT_FOUND');
  });
});
