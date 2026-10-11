import type { Appointment } from '../../../shared/types/appointments';
import { getStore } from '../../../shared/infra/store';

export interface AgendaFilter {
  from: Date;
  to: Date;
  resourceId?: string;
}

function tenantResourceIds(tenantId: string): Set<string> {
  return new Set(
    getStore()
      .resources.filter((resource) => resource.tenantId === tenantId)
      .map((resource) => resource.id),
  );
}

/** Appointments whose start falls inside the requested window, scoped to the tenant. */
export function listAgenda(filter: AgendaFilter, tenantId: string): Appointment[] {
  const fromMs = filter.from.getTime();
  const toMs = filter.to.getTime();
  const resourceIds = tenantResourceIds(tenantId);
  return getStore()
    .appointments.filter((appointment) => {
      if (!resourceIds.has(appointment.resourceId)) return false;
      const startMs = new Date(appointment.startAt).getTime();
      if (startMs < fromMs || startMs > toMs) return false;
      if (filter.resourceId && appointment.resourceId !== filter.resourceId) return false;
      return true;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}
