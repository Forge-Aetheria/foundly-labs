import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';

/**
 * Route-level loading UI for every `/admin/*` module. It is rendered inside the
 * persistent AdminShell (so the sidebar stays interactive) while the target
 * page streams in.
 */
export default function AdminLoading() {
  return <ModuleSkeleton />;
}
