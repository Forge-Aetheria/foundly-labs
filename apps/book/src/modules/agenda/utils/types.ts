import type { AppointmentNotification } from '../../../shared/types/appointments';
import type { AdvancePayment } from '../../../shared/types/payments';

/** Row shape consumed by the agenda table and its dialogs. */
export interface AgendaRow {
  id: string;
  startAt: string;
  endAt: string;
  clientName: string;
  clientContact: string | null;
  serviceName: string;
  durationMinutes: number;
  resourceName: string;
  status: string;
  currency: string;
  payment: AdvancePayment | null;
  notifications: AppointmentNotification[];
}
