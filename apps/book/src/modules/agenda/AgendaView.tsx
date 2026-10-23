'use client';

import { useEffect, useState } from 'react';
import { Agenda, type AgendaRow } from './components/Agenda';
import { listAgenda } from './actions';
import { listServices } from '../services/actions';
import { listStaff } from '../staff/actions';
import { useAdminWorkspace } from '../../shared/admin/AdminWorkspaceContext';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';
import type { AdminResourceState } from '../../shared/hooks/useAdminResource';
import type { Resource, Service } from '../../shared/types/appointments';

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeRange(from?: string, to?: string): { from: string; to: string } {
  const now = new Date();
  const defaultFrom = dayKey(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  );
  const defaultTo = dayKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)));
  const isDay = (value?: string): value is string =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const resolvedFrom = isDay(from) ? from : defaultFrom;
  const resolvedTo = isDay(to) ? to : defaultTo;
  return resolvedTo < resolvedFrom
    ? { from: resolvedFrom, to: resolvedFrom }
    : { from: resolvedFrom, to: resolvedTo };
}

interface AgendaData {
  rows: AgendaRow[];
  services: Service[];
  resources: Resource[];
  error: string | null;
}

/** Agenda module view (client): range rows + catalogs loaded after mount. */
export function AgendaView({ from, to }: { from?: string; to?: string }) {
  const workspace = useAdminWorkspace();
  const tenantId = workspace?.tenantId;
  const [state, setState] = useState<AdminResourceState<AgendaData>>({ status: 'loading' });

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    const range = normalizeRange(from, to);
    const fromDate = new Date(`${range.from}T00:00:00.000Z`);
    const toDate = new Date(`${range.to}T23:59:59.999Z`);
    let active = true;
    setState({ status: 'loading' });

    Promise.all([
      listAgenda({ from: fromDate, to: toDate }),
      listServices(tenantId),
      listStaff(tenantId),
    ])
      .then(([agendaResult, servicesResult, staffResult]) => {
        if (!active) {
          return;
        }

        const services = servicesResult.ok ? servicesResult.data.services : [];
        const resources = staffResult.ok ? staffResult.data : [];
        const error = !agendaResult.ok
          ? agendaResult.error.message
          : !servicesResult.ok
            ? servicesResult.error.message
            : !staffResult.ok
              ? staffResult.error.message
              : null;

        if (!agendaResult.ok) {
          setState({ status: 'error', message: error ?? 'No pudimos cargar la agenda.' });
          return;
        }

        const rows: AgendaRow[] = agendaResult.data.map((row) => ({
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

        setState({ status: 'ready', data: { rows, services, resources, error } });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'No pudimos cargar la agenda.',
        });
      });

    return () => {
      active = false;
    };
  }, [tenantId, from, to]);

  if (state.status === 'loading') {
    return <ModuleSkeleton rows={5} />;
  }

  const data =
    state.status === 'ready'
      ? state.data
      : { rows: [], services: [], resources: [], error: state.message };

  return (
    <Agenda
      appointments={data.rows}
      range={normalizeRange(from, to)}
      services={data.services}
      resources={data.resources}
      error={data.error}
    />
  );
}
