import type { Appointment } from '../../../shared/types/appointments';
import {
  listRemoteAppointments,
  mapAppointmentDto,
} from '../../../shared/infra/remoteAppointments';
import type { ActionResult } from '../../../shared/infra/result';

export interface AgendaFilter {
  from: Date;
  to: Date;
  resourceId?: string;
}

/**
 * Appointments whose start falls inside the requested window, scoped to the
 * tenant (feature 010 — T012). SERVER-ONLY via `remoteAppointments`; no store.
 */
export async function listAgenda(
  filter: AgendaFilter,
  tenantId: string,
): Promise<ActionResult<Appointment[]>> {
  const result = await listRemoteAppointments({
    tenantId,
    startDate: filter.from.toISOString(),
    endDate: filter.to.toISOString(),
    specialistId: filter.resourceId ?? null,
  });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map(mapAppointmentDto) };
}