import { EmptyState } from '@/shared/ui/EmptyState';

export function NotificationsEmpty() {
  return (
    <EmptyState
      title="Sin notificaciones"
      message="Los avisos de nuevas reservas y cambios en tu negocio aparecerán aquí."
    />
  );
}
