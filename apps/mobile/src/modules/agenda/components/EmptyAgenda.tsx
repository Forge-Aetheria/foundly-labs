import { EmptyState } from '@/shared/ui/EmptyState';

export function EmptyAgenda() {
  return (
    <EmptyState
      title="Sin citas para hoy"
      message="Cuando tus clientes reserven, las citas aparecerán aquí automáticamente."
    />
  );
}
