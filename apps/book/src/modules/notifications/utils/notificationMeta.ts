import type { SvgIconComponent } from '@mui/icons-material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { NotificationType } from './types';

export type NotificationTone = 'booking' | 'warning' | 'info';

export interface NotificationMeta {
  /** Accessible label for the notification type. */
  label: string;
  icon: SvgIconComponent;
  tone: NotificationTone;
}

/** Type → icon/label/tone mapping used by the bell dropdown and the inbox page. */
export function notificationMeta(type: NotificationType): NotificationMeta {
  switch (type) {
    case NotificationType.NewBooking:
      return { label: 'Nueva reserva', icon: CalendarMonthIcon, tone: 'booking' };
    case NotificationType.RescheduleRequest:
      return { label: 'Solicitud de reprogramación', icon: AutorenewIcon, tone: 'info' };
    case NotificationType.SubscriptionExpiring:
      return { label: 'Suscripción por vencer', icon: WarningAmberIcon, tone: 'warning' };
    case NotificationType.SubscriptionExpired:
      return { label: 'Suscripción vencida', icon: EventBusyIcon, tone: 'warning' };
    case NotificationType.SystemInfo:
      return { label: 'Información', icon: InfoOutlinedIcon, tone: 'info' };
    default:
      return { label: 'Notificación', icon: InfoOutlinedIcon, tone: 'info' };
  }
}
