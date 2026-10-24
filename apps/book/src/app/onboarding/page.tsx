import { OnboardingView } from '../../modules/onboarding/OnboardingView';

/** Onboarding route (public `/book/onboarding`): thin page → wizard view. */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === 'string' ? params.email : undefined;
  return <OnboardingView initialEmail={email} />;
}
