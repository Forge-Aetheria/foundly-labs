import { getModuleById } from '@/shared/navigation/modules';
import { ModulePlaceholderView } from '@/shared/ui/ModulePlaceholderView';

const module = getModuleById('galeria');

export default function GaleriaRoute() {
  return (
    <ModulePlaceholderView
      title={module.label}
      description={module.description}
      icon={module.icon}
    />
  );
}
