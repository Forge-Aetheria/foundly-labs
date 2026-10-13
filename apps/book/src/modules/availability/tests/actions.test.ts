import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AddTimeBlockDocument,
  RemoveTimeBlockDocument,
  TimeBlocksDocument,
} from '../../../shared/api/generated';
import { addTimeBlock, listTimeBlocks, removeTimeBlock } from '../actions';

const { apiMock, tenantMock } = vi.hoisted(() => ({ apiMock: vi.fn(), tenantMock: vi.fn() }));

vi.mock('../../../shared/api/admin-request', () => ({
  apiRequestAdmin: (...args: unknown[]) => apiMock(...args),
}));
vi.mock('../../../shared/utils/tenant-scope', () => ({
  adminTenantId: (...args: unknown[]) => tenantMock(...args),
}));

describe('availability block actions (feature 015)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenantMock.mockResolvedValue({ ok: true, data: 'ten-ana' });
  });

  it('lists the tenant blocks through the session-aware transport', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: {
        timeBlocks: [
          { id: 'tb1', tenantId: 'ten-ana', specialistId: null, startAt: '2026-12-24T09:00:00.000Z', endAt: '2026-12-24T13:00:00.000Z', reason: 'Nochebuena' },
        ],
      },
    });

    const result = await listTimeBlocks('ten-ana');
    expect(apiMock).toHaveBeenCalledWith(TimeBlocksDocument, { tenantId: 'ten-ana', tenantSlug: null, specialistId: null });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0]).toMatchObject({ id: 'tb1', resourceId: 'ten-ana', kind: 'block', recurrence: 'none', reason: 'Nochebuena' });
    }
  });

  it('rejects an invalid block before calling the API', async () => {
    const result = await addTimeBlock({ date: 'bad', startTime: '09:00', endTime: '13:00' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('rejects an end time that is not after the start', async () => {
    const result = await addTimeBlock({ date: '2026-12-24', startTime: '18:00', endTime: '09:00' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('adds a block through the API', async () => {
    apiMock.mockResolvedValue({
      ok: true,
      data: {
        addTimeBlock: {
          id: 'tb9',
          tenantId: 'ten-ana',
          specialistId: null,
          startAt: '2026-12-24T09:00:00',
          endAt: '2026-12-24T13:00:00',
          reason: 'Nochebuena',
        },
      },
    });

    const result = await addTimeBlock({ date: '2026-12-24', startTime: '09:00', endTime: '13:00', reason: 'Nochebuena' });
    expect(apiMock).toHaveBeenCalledWith(AddTimeBlockDocument, {
      input: { startAt: '2026-12-24T09:00:00', endAt: '2026-12-24T13:00:00', reason: 'Nochebuena' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBe('tb9');
  });

  it('removes a block through the API', async () => {
    apiMock.mockResolvedValue({ ok: true, data: { removeTimeBlock: true } });
    const result = await removeTimeBlock({ id: 'tb1' });
    expect(apiMock).toHaveBeenCalledWith(RemoveTimeBlockDocument, { id: 'tb1' });
    expect(result.ok).toBe(true);
  });

  it('routes session errors through the session-aware transport (no raw text handling)', async () => {
    apiMock.mockResolvedValue({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'x' } });
    const result = await listTimeBlocks('ten-ana');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });
});
