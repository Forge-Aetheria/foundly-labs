import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppointmentDocument,
  AppointmentStatus,
  CancelAppointmentDocument,
  CreateAppointmentDocument,
  MyServicesDocument,
  UpdateAppointmentStatusDocument,
} from '../../../shared/api/generated';
import { cancelAppointment, changeAppointmentStatus, createAppointment } from '../actions';

const { apiMock, sessionMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  sessionMock: { getEffectiveSession: vi.fn(), getAccessToken: vi.fn() },
}));

vi.mock('../../../shared/api/client', () => ({ apiRequest: (...args: unknown[]) => apiMock(...args) }));
vi.mock('../../../shared/auth/authServer', () => ({
  getEffectiveSession: (...args: unknown[]) => sessionMock.getEffectiveSession(...args),
  getAccessToken: (...args: unknown[]) => sessionMock.getAccessToken(...args),
}));

const admin = { userId: 'u-admin', role: 'admin' as const, tenantId: 'ten-ana' };
const otherPro = {
  userId: 'u-pro',
  role: 'professional' as const,
  resourceId: 'res-other',
  tenantId: 'ten-ana',
};

const service = {
  id: 'svc-corte',
  name: 'Corte de cabello',
  description: null,
  priceCents: 2000,
  durationMinutes: 30,
  category: null,
  active: true,
};

function makeDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt-1',
    tenantId: 'ten-ana',
    serviceId: 'svc-corte',
    specialistId: 'res-ana',
    clientName: 'Luis',
    clientContact: null,
    startAt: '2026-06-03T10:00:00.000Z',
    endAt: '2026-06-03T10:30:00.000Z',
    status: AppointmentStatus.Pending,
    appliedDurationMinutes: 30,
    appliedAmountCents: 2000,
    appliedCurrency: 'EUR',
    origin: 'admin',
    notes: null,
    cancellationReason: null,
    service: { id: 'svc-corte', name: 'Corte de cabello' },
    specialist: { id: 'res-ana', name: 'Ana' },
    ...overrides,
  };
}

const input = {
  resourceId: 'res-ana',
  serviceId: 'svc-corte',
  clientName: 'Luis',
  startAt: '2026-06-03T10:00:00Z',
};

describe('appointment actions (feature 011 — remote-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.getEffectiveSession.mockResolvedValue(admin);
    sessionMock.getAccessToken.mockResolvedValue('token-test');
    apiMock.mockImplementation(async (document: unknown) => {
      if (document === MyServicesDocument) return { ok: true, data: { myServices: [service] } };
      if (document === CreateAppointmentDocument)
        return { ok: true, data: { createAppointment: makeDto() } };
      if (document === AppointmentDocument) return { ok: true, data: { appointment: makeDto() } };
      if (document === CancelAppointmentDocument)
        return { ok: true, data: { cancelAppointment: makeDto({ status: AppointmentStatus.Cancelled }) } };
      if (document === UpdateAppointmentStatusDocument)
        return {
          ok: true,
          data: { updateAppointmentStatus: makeDto({ status: AppointmentStatus.Confirmed }) },
        };
      return { ok: false, error: { code: 'STATE_ERROR', message: 'unexpected document' } };
    });
  });

  it('creates an appointment through the API and maps the result', async () => {
    const result = await createAppointment(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.resourceId).toBe('res-ana');
      expect(result.data.status).toBe('pending');
      expect(result.data.appliedAmountCents).toBe(2000);
    }
  });

  it('propagates remote CONFLICT', async () => {
    apiMock.mockImplementation(async (document: unknown) => {
      if (document === MyServicesDocument) return { ok: true, data: { myServices: [service] } };
      return { ok: false, error: { code: 'CONFLICT', message: 'Slot overlaps' } };
    });
    const result = await createAppointment(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CONFLICT');
  });

  it('forbids a professional acting on another resource', async () => {
    sessionMock.getEffectiveSession.mockResolvedValue(otherPro);
    const result = await createAppointment(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
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
  });

  it('rejects cancelling without a reason', async () => {
    const result = await cancelAppointment({ appointmentId: 'apt-1', reason: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('changes status through the API with the mapped enum', async () => {
    const result = await changeAppointmentStatus({ appointmentId: 'apt-1', status: 'confirmed' });
    expect(result.ok).toBe(true);
    expect(apiMock).toHaveBeenCalledWith(UpdateAppointmentStatusDocument, {
      id: 'apt-1',
      status: AppointmentStatus.Confirmed,
    });
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