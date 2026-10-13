import { Agenda, type AgendaRow } from './components/Agenda';
import { listAgenda } from './actions';
import { listServices } from '../services/actions';
import { listStaff } from '../staff/actions';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Agenda module view (server): resolves the week's rows and renders the table. */
export async function AgendaView() {
  const tenantId = await getAdminTenantId();
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const to = new Date(from.getTime() + 7 * 86_400_000);

  const [agendaResult, servicesResult, staffResult] = await Promise.all([
    listAgenda({ from, to }, tenantId),
    listServices(tenantId),
    listStaff(tenantId),
  ]);

  const services = servicesResult.ok ? servicesResult.data.services : [];
  const resources = staffResult.ok ? staffResult.data : [];
  const error =
    !agendaResult.ok
      ? agendaResult.error.message
      : !servicesResult.ok
        ? servicesResult.error.message
        : !staffResult.ok
          ? staffResult.error.message
          : null;

  const appointments: AgendaRow[] = (agendaResult.ok ? agendaResult.data : []).map((row) => ({
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

  return (
    <Agenda
      appointments={appointments}
      services={services}
      resources={resources}
      error={error}
    />
  );
}