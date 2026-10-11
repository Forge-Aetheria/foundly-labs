import { beforeEach, describe, expect, it } from 'vitest';
import type { Session } from '../../../shared/infra/auth';
import { getStore, resetStore } from '../../../shared/infra/store';
import {
  cancelAppointment,
  changeAppointmentStatus,
  createAppointment,
  rescheduleAppointment,
} from '../utils/actions';

const admin: Session = { userId: 'u-admin', role: 'admin' };
const otherPro: Session = { userId: 'u-pro', role: 'professional', resourceId: 'res-other' };

beforeEach(() => {
  resetStore();
});

const input = {
  resourceId: 'res-ana',
  serviceId: 'svc-corte',
  clientName: 'Luis',
  startAt: '2026-06-03T10:00:00Z',
};

describe('appointment actions (contracts/server-actions.contract.md)', () => {
  it('creates an appointment with the catalog snapshot', () => {
    const result = createAppointment(admin, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.appliedDurationMinutes).toBe(30);
      expect(result.data.appliedAmountCents).toBe(2000);
      expect(result.data.appliedCurrency).toBe('EUR');
      expect(result.data.status).toBe('pending');
    }
  });

  it('rejects an overlapping booking with CONFLICT (SC-003)', () => {
    createAppointment(admin, input);
    const conflict = createAppointment(admin, {
      ...input,
      clientName: 'B',
      startAt: '2026-06-03T10:15:00Z',
    });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) expect(conflict.error.code).toBe('CONFLICT');
  });

  it('keeps the snapshot after a catalog price change (SC-005)', () => {
    const created = createAppointment(admin, input);
    getStore().rates.push({
      id: 'rate-2',
      serviceId: 'svc-corte',
      amountCents: 3500,
      currency: 'EUR',
      effectiveFrom: '2026-06-03T00:00:00.000Z',
      effectiveTo: null,
    });
    const later = createAppointment(admin, {
      ...input,
      clientName: 'C',
      startAt: '2026-06-04T10:00:00Z',
    });
    expect(created.ok && created.data.appliedAmountCents).toBe(2000);
    expect(later.ok && later.data.appliedAmountCents).toBe(3500);
  });

  it('reschedules and frees the previous slot', () => {
    const created = createAppointment(admin, input);
    if (!created.ok) throw new Error('setup failed');
    const moved = rescheduleAppointment(admin, {
      appointmentId: created.data.id,
      startAt: '2026-06-03T11:00:00Z',
    });
    expect(moved.ok).toBe(true);
    const reused = createAppointment(admin, { ...input, clientName: 'B' });
    expect(reused.ok).toBe(true);
  });

  it('requires a reason to cancel', () => {
    const created = createAppointment(admin, input);
    if (!created.ok) throw new Error('setup failed');
    const bad = cancelAppointment(admin, { appointmentId: created.data.id, reason: '' });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.code).toBe('VALIDATION_ERROR');
  });

  it('enforces lifecycle transitions (STATE_ERROR)', () => {
    const created = createAppointment(admin, input);
    if (!created.ok) throw new Error('setup failed');
    const invalid = changeAppointmentStatus(admin, {
      appointmentId: created.data.id,
      status: 'completed',
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.code).toBe('STATE_ERROR');
    const valid = changeAppointmentStatus(admin, {
      appointmentId: created.data.id,
      status: 'confirmed',
    });
    expect(valid.ok).toBe(true);
  });

  it('forbids a professional acting on another resource (FORBIDDEN)', () => {
    const result = createAppointment(otherPro, input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
  });
});
