import { getModuleById } from '@/shared/navigation/modules';
import { ModulePlaceholderView } from '@/shared/ui/ModulePlaceholderView';

const module = getModuleById('resenas');

export default function ResenasRoute() {
  return (
    <ModulePlaceholderView
      title={module.label}
      description={module.description}
      icon={module.icon}
    />
  );
}
