import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PaymentsService } from './payments.service';
import { PAYMENTS_STORE, type PaymentMethodRow } from './payments.store';
import { createMemoryPaymentsStore, type MemoryPaymentsStore } from './payments.test-store';
import { PaymentMethodType } from './payments.types';

function seedRow(overrides: Partial<PaymentMethodRow> & { tenantId: string }): PaymentMethodRow {
  return {
    id: overrides.id ?? `pm-${overrides.tenantId}-${overrides.type ?? 'x'}`,
    type: PaymentMethodType.mobile_payment,
    label: null,
    details: null,
    instructions: null,
    active: false,
    createdAt: '2026-10-13T00:00:00.000Z',
    updatedAt: '2026-10-13T00:00:00.000Z',
    ...overrides,
  };
}

describe('PaymentsService (unit, 016-advance-payments)', () => {
  let service: PaymentsService;
  let store: MemoryPaymentsStore;

  beforeEach(async () => {
    store = createMemoryPaymentsStore();
    const moduleRef = await Test.createTestingModule({
      providers: [PaymentsService, { provide: PAYMENTS_STORE, useValue: store }],
    }).compile();
    service = moduleRef.get(PaymentsService);
  });

  it('lists the caller tenant methods including inactive ones', async () => {
    store.seed(seedRow({ tenantId: 't1', type: PaymentMethodType.mobile_payment, active: true }));
    store.seed(seedRow({ tenantId: 't1', type: PaymentMethodType.binance, active: false }));
    store.seed(seedRow({ tenantId: 't2', type: PaymentMethodType.bank_transfer, active: true }));

    const rows = await service.listForAdmin({ tenantId: 't1' });
    expect(rows.map((row) => row.type).sort()).toEqual(['binance', 'mobile_payment']);
  });

  it('upserts by type (create then replace) and defaults active to false', async () => {
    const created = await service.upsert({ tenantId: 't1' }, {
      type: PaymentMethodType.mobile_payment,
      details: '  Banco X  ',
    });
    expect(created.active).toBe(false);
    expect(created.details).toBe('Banco X');

    const replaced = await service.upsert({ tenantId: 't1' }, {
      type: PaymentMethodType.mobile_payment,
      label: 'Pago Móvil',
      active: true,
    });
    expect(replaced.id).toBe(created.id);
    expect(replaced.active).toBe(true);
    expect(replaced.label).toBe('Pago Móvil');

    const rows = await service.listForAdmin({ tenantId: 't1' });
    expect(rows).toHaveLength(1);
  });

  it('lists only active methods publicly', async () => {
    store.seed(seedRow({ tenantId: 't1', type: PaymentMethodType.mobile_payment, active: true }));
    store.seed(seedRow({ tenantId: 't1', type: PaymentMethodType.binance, active: false }));

    const rows = await service.listPublic({ tenantId: 't1' });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.type).toBe(PaymentMethodType.mobile_payment);

    expect(await service.listPublic({ tenantSlug: 'unknown' })).toEqual([]);
  });

  it('removes an owned method and rejects a foreign/missing one', async () => {
    const row = store.seed(seedRow({ tenantId: 't1', type: PaymentMethodType.mobile_payment }));
    expect(await service.remove({ tenantId: 't1' }, row.id)).toBe(true);
    await expect(service.remove({ tenantId: 't2' }, row.id)).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('rejects anonymous writes with UNAUTHENTICATED', async () => {
    await expect(
      service.upsert(undefined, { type: PaymentMethodType.binance, active: true }),
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
    await expect(service.listForAdmin(undefined)).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });
});
