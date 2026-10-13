import { OnboardingView } from '../../modules/onboarding/OnboardingView';
import { ConnectionStatus } from '../../shared/components/ConnectionStatus';

/** Onboarding route (public `/book/onboarding`): thin page → wizard view. */
export default function OnboardingPage() {
  return (
    <>
      <ConnectionStatus />
      <OnboardingView />
    </>
  );
}
