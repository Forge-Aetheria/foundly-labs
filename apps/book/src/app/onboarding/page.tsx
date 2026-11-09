import { useSearchParams } from '@/shared/compat/useAppRouter';
import { PageMeta } from '../../shared/components/PageMeta';
import { OnboardingView } from '../../modules/onboarding/OnboardingView';

/** Onboarding route (public `/onboarding`): thin page → wizard view. */
export default function OnboardingPage() {
  const params = useSearchParams();
  const email = params.get('email') ?? undefined;
  return (
    <>
      <PageMeta title="Registrar mi negocio" description="Crea tu negocio en Foundly Book." />
      <OnboardingView initialEmail={email} />
    </>
  );
}
