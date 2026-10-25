import { getModuleById } from '@/shared/navigation/modules';
import { ModulePlaceholderView } from '@/shared/ui/ModulePlaceholderView';

const module = getModuleById('soporte');

export default function SoporteRoute() {
  return (
    <ModulePlaceholderView
      title={module.label}
      description={module.description}
      icon={module.icon}
    />
  );
}
