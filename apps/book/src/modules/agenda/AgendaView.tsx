import { Agenda, type AgendaRow } from './components/Agenda';
import { listAgenda } from './actions';
import { listServices } from '../services/actions';
import { listStaff } from '../staff/actions';
import { getAdminTenantId } from '../../shared/tenancy/queries';

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeRange(from?: string, to?: string): { from: string; to: string } {
  const now = new Date();
  const defaultFrom = dayKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));
  const defaultTo = dayKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)));
  const isDay = (value?: string): value is string =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const resolvedFrom = isDay(from) ? from : defaultFrom;
  const resolvedTo = isDay(to) ? to : defaultTo;
  return resolvedTo < resolvedFrom
    ? { from: resolvedFrom, to: resolvedFrom }
    : { from: resolvedFrom, to: resolvedTo };
}

/** Agenda module view (server): resolves the range's rows and renders the table. */
export async function AgendaView({ from, to }: { from?: string; to?: string }) {
  const tenantId = await getAdminTenantId();
  const range = normalizeRange(from, to);
  const fromDate = new Date(`${range.from}T00:00:00.000Z`);
  const toDate = new Date(`${range.to}T23:59:59.999Z`);

  const [agendaResult, servicesResult, staffResult] = await Promise.all([
    listAgenda({ from: fromDate, to: toDate }),
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
    currency: row.appliedCurrency,
    payment: row.payment,
    notifications: row.notifications,
  }));

  return (
    <Agenda
      appointments={appointments}
      range={range}
      services={services}
      resources={resources}
      error={error}
    />
  );
}
