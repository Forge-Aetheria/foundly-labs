import { getModuleById } from '@/shared/navigation/modules';
import { ModulePlaceholderView } from '@/shared/ui/ModulePlaceholderView';

const module = getModuleById('disponibilidad');

export default function DisponibilidadRoute() {
  return (
    <ModulePlaceholderView
      title={module.label}
      description={module.description}
      icon={module.icon}
    />
  );
}
