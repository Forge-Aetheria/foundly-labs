import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CreateMyServiceDocument,
  DeleteMyServiceDocument,
} from '../../../shared/api/generated';
import { createService, deleteService } from '../actions';

const { adminMock } = vi.hoisted(() => ({ adminMock: vi.fn() }));

vi.mock('../../../shared/api/admin-request', () => ({
  apiRequestAdmin: (...args: unknown[]) => adminMock(...args),
}));
vi.mock('../../../shared/auth/authServer', () => ({
  getEffectiveSession: async () => ({ tenantId: 'ten-ana', role: 'owner', resourceId: null }),
}));

describe('services actions (feature 016, US5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid service input before calling the API', async () => {
    const result = await createService({ name: '', durationMinutes: 0, priceCents: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(adminMock).not.toHaveBeenCalled();
  });

  it('creates a service through the API and maps it to the domain', async () => {
    adminMock.mockResolvedValue({
      ok: true,
      data: {
        createMyService: {
          id: 's9',
          name: 'Corte',
          description: null,
          priceCents: 2000,
          durationMinutes: 30,
          category: null,
          active: true,
        },
      },
    });

    const result = await createService({ name: 'Corte', durationMinutes: 30, priceCents: 2000 });
    expect(adminMock).toHaveBeenCalledWith(CreateMyServiceDocument, {
      input: {
        name: 'Corte',
        description: null,
        priceCents: 2000,
        durationMinutes: 30,
        category: null,
        active: true,
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({
        id: 's9',
        name: 'Corte',
        durationMinutes: 30,
        tenantId: 'ten-ana',
      });
    }
  });

  it('deletes a service through the API', async () => {
    adminMock.mockResolvedValue({ ok: true, data: { deleteMyService: true } });
    const result = await deleteService({ id: 's9' });
    expect(adminMock).toHaveBeenCalledWith(DeleteMyServiceDocument, { id: 's9' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 's9' });
  });
});
