import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppointmentDto } from '../../../shared/infra/remoteAppointments';
import type { Service } from '../../../shared/types/appointments';
import {
  cancelAppointment,
  changeAppointmentStatus,
  createAppointment,
} from '../utils/actions';

const { sessionMock, remoteMock } = vi.hoisted(() => ({
  sessionMock: { getEffectiveSession: vi.fn() },
  remoteMock: {
    listRemoteServices: vi.fn(),
    createRemoteAppointment: vi.fn(),
    findRemoteAppointment: vi.fn(),
    cancelRemoteAppointment: vi.fn(),
    updateRemoteAppointmentStatus: vi.fn(),
  },
}));

vi.mock('../../../shared/infra/authServer', () => ({
  getEffectiveSession: (...args: unknown[]) => sessionMock.getEffectiveSession(...args),
  getAccessToken: vi.fn(async () => 'token-test'),
}));

vi.mock('../../../shared/infra/remoteCatalog', () => ({
  listRemoteServices: (...args: unknown[]) => remoteMock.listRemoteServices(...args),
}));

vi.mock('../../../shared/infra/remoteAppointments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shared/infra/remoteAppointments')>();
  return {
    ...actual,
    createRemoteAppointment: (...args: unknown[]) => remoteMock.createRemoteAppointment(...args),
    findRemoteAppointment: (...args: unknown[]) => remoteMock.findRemoteAppointment(...args),
    cancelRemoteAppointment: (...args: unknown[]) => remoteMock.cancelRemoteAppointment(...args),
    updateRemoteAppointmentStatus: (...args: unknown[]) =>
      remoteMock.updateRemoteAppointmentStatus(...args),
  };
});

const admin = { userId: 'u-admin', role: 'admin' as const, tenantId: 'ten-ana' };
const otherPro = {
  userId: 'u-pro',
  role: 'professional' as const,
  resourceId: 'res-other',
  tenantId: 'ten-ana',
};

function makeDto(overrides: Partial<AppointmentDto> = {}): AppointmentDto {
  return {
    id: 'apt-1',
    tenantId: 'ten-ana',
    serviceId: 'svc-corte',
    specialistId: 'res-ana',
    clientName: 'Luis',
    clientContact: null,
    startAt: '2026-06-03T10:00:00.000Z',
    endAt: '2026-06-03T10:30:00.000Z',
    status: 'PENDING',
    appliedDurationMinutes: 30,
    appliedAmountCents: 2000,
    appliedCurrency: 'EUR',
    origin: 'admin',
    notes: null,
    cancellationReason: null,
    service: { id: 'svc-corte', name: 'Corte de cabello' },
    specialist: { id: 'res-ana', name: 'Ana Profesional' },
    ...overrides,
  };
}

const service: Service = {
  id: 'svc-corte',
  name: 'Corte de cabello',
  description: null,
  durationMinutes: 30,
  bufferMinutes: 0,
  category: null,
  active: true,
  tenantId: 'ten-ana',
};

const input = {
  resourceId: 'res-ana',
  serviceId: 'svc-corte',
  clientName: 'Luis',
  startAt: '2026-06-03T10:00:00Z',
};

describe('appointment actions (feature 010 — remote-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.getEffectiveSession.mockResolvedValue(admin);
    remoteMock.listRemoteServices.mockResolvedValue({ ok: true, data: { services: [service], rates: [] } });
    remoteMock.createRemoteAppointment.mockResolvedValue({ ok: true, data: makeDto() });
    remoteMock.findRemoteAppointment.mockResolvedValue({ ok: true, data: makeDto() });
    remoteMock.cancelRemoteAppointment.mockResolvedValue({
      ok: true,
      data: makeDto({ status: 'CANCELLED', cancellationReason: 'Motivo' }),
    });
    remoteMock.updateRemoteAppointmentStatus.mockResolvedValue({
      ok: true,
      data: makeDto({ status: 'CONFIRMED' }),
    });
  });

  it('creates an appointment through the API and maps the result', async () => {
    const result = await createAppointment(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.resourceId).toBe('res-ana');
      expect(result.data.appliedDurationMinutes).toBe(30);
      expect(result.data.appliedAmountCents).toBe(2000);
      expect(result.data.status).toBe('pending');
    }
    expect(remoteMock.createRemoteAppointment).toHaveBeenCalledWith({
      tenantId: 'ten-ana',
      serviceId: 'svc-corte',
      specialistId: 'res-ana',
      clientName: 'Luis',
      clientContact: null,
      startAt: '2026-06-03T10:00:00.000Z',
      endAt: '2026-06-03T10:30:00.000Z',
      origin: 'admin',
      notes: null,
    });
  });

  it('propagates remote errors (CONFLICT etc.) without local logic', async () => {
    remoteMock.createRemoteAppointment.mockResolvedValue({
      ok: false,
      error: { code: 'CONFLICT', message: 'Slot overlaps an existing appointment' },
    });
    const result = await createAppointment(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CONFLICT');
  });

  it('forbids a professional acting on another resource (FORBIDDEN)', async () => {
    sessionMock.getEffectiveSession.mockResolvedValue(otherPro);
    const result = await createAppointment(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
    expect(remoteMock.createRemoteAppointment).not.toHaveBeenCalled();
  });

  it('rejects malformed input with VALIDATION_ERROR', async () => {
    const result = await createAppointment({ ...input, clientName: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('cancels through the API (requires a reason)', async () => {
    const result = await cancelAppointment({ appointmentId: 'apt-1', reason: 'Motivo' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe('cancelled');
    expect(remoteMock.cancelRemoteAppointment).toHaveBeenCalledWith('apt-1', 'Motivo');
  });

  it('rejects cancelling without a reason', async () => {
    const result = await cancelAppointment({ appointmentId: 'apt-1', reason: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('changes status through the API with the mapped enum', async () => {
    const result = await changeAppointmentStatus({ appointmentId: 'apt-1', status: 'confirmed' });
    expect(result.ok).toBe(true);
    expect(remoteMock.updateRemoteAppointmentStatus).toHaveBeenCalledWith('apt-1', 'CONFIRMED');
  });

  it('rejects statuses the provider cannot target', async () => {
    const result = await changeAppointmentStatus({ appointmentId: 'apt-1', status: 'checked-in' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('forbids a professional touching another specialist appointment', async () => {
    sessionMock.getEffectiveSession.mockResolvedValue(otherPro);
    const result = await cancelAppointment({ appointmentId: 'apt-1', reason: 'Motivo' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
  });
});