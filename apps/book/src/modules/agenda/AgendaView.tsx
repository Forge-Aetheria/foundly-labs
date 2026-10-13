import { Agenda, type AgendaRow } from './components/Agenda';
import { listServices } from '../services/utils/queries';
import { listAgenda } from './utils/queries';
import { getStore } from '../../shared/infra/store';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Agenda module view (server): resolves the week's rows and renders the table. */
export async function AgendaView() {
  const tenantId = await getAdminTenantId();
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const to = new Date(from.getTime() + 7 * 86_400_000);

  const { services } = await listServices(tenantId);
  const resources = getStore().resources.filter((resource) => resource.tenantId === tenantId);

  const appointments: AgendaRow[] = listAgenda({ from, to }, tenantId).map((row) => ({
    id: row.id,
    startAt: row.startAt,
    endAt: row.endAt,
    clientName: row.clientName,
    clientContact: row.clientContact,
    serviceName: services.find((service) => service.id === row.serviceId)?.name ?? '—',
    durationMinutes: row.appliedDurationMinutes,
    resourceName: resources.find((resource) => resource.id === row.resourceId)?.name ?? '—',
    status: row.status,
  }));

  return <Agenda appointments={appointments} />;
}
