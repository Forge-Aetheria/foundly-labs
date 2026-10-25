import { getModuleById } from '@/shared/navigation/modules';
import { ModulePlaceholderView } from '@/shared/ui/ModulePlaceholderView';

const module = getModuleById('servicios');

export default function ServiciosRoute() {
  return (
    <ModulePlaceholderView
      title={module.label}
      description={module.description}
      icon={module.icon}
    />
  );
}
