import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DeletePaymentMethodDocument,
  MyPaymentMethodsDocument,
  UpsertPaymentMethodDocument,
} from '../../../shared/api/generated';
import { deletePaymentMethod, listPaymentMethods, upsertPaymentMethod } from '../actions';

const { adminMock } = vi.hoisted(() => ({ adminMock: vi.fn() }));

vi.mock('../../../shared/api/admin-request', () => ({
  apiRequestAdmin: (...args: unknown[]) => adminMock(...args),
}));
vi.mock('../../../shared/auth/authServer', () => ({
  getEffectiveSession: async () => ({ tenantId: 'ten-ana', role: 'owner', resourceId: null }),
}));

const dto = {
  id: 'pm1',
  tenantId: 'ten-ana',
  type: 'mobile_payment',
  label: null,
  details: 'Banco X',
  instructions: null,
  active: true,
};

describe('configuration actions (feature 017, US1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists the payment methods and maps them to the domain', async () => {
    adminMock.mockResolvedValue({ ok: true, data: { myPaymentMethods: [dto] } });
    const result = await listPaymentMethods();
    expect(adminMock).toHaveBeenCalledWith(MyPaymentMethodsDocument, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0]).toMatchObject({
        id: 'pm1',
        type: 'mobile_payment',
        details: 'Banco X',
        active: true,
      });
    }
  });

  it('rejects an invalid method before calling the API', async () => {
    const result = await upsertPaymentMethod({ type: 'bogus', active: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(adminMock).not.toHaveBeenCalled();
  });

  it('upserts a method through the API', async () => {
    adminMock.mockResolvedValue({ ok: true, data: { upsertPaymentMethod: dto } });
    const result = await upsertPaymentMethod({
      type: 'mobile_payment',
      details: '  Banco X  ',
      active: true,
    });
    expect(adminMock).toHaveBeenCalledWith(UpsertPaymentMethodDocument, {
      input: {
        type: 'mobile_payment',
        label: null,
        details: 'Banco X',
        instructions: null,
        active: true,
      },
    });
    expect(result.ok).toBe(true);
  });

  it('deletes a method through the API', async () => {
    adminMock.mockResolvedValue({ ok: true, data: { deletePaymentMethod: true } });
    const result = await deletePaymentMethod({ id: 'pm1' });
    expect(adminMock).toHaveBeenCalledWith(DeletePaymentMethodDocument, { id: 'pm1' });
    expect(result).toEqual({ ok: true, data: { id: 'pm1' } });
  });
});
