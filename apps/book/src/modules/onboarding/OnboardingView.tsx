import { WizardShell } from './components/WizardShell';

/** Onboarding module view (server): renders the three-step business wizard. */
export function OnboardingView({ initialEmail }: { initialEmail?: string }) {
  return <WizardShell initialEmail={initialEmail} />;
}
