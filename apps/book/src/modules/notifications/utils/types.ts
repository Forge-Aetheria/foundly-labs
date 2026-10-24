import { NotificationType } from '../../../shared/api/generated';

export { NotificationType };

/** Notification as consumed by the admin UI (mapped from codegen types). */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  /** ISO-8601 timestamp. */
  createdAt: string;
}
