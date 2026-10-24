import { redirect } from 'next/navigation';

/** Alias for the registration entry point: `/register` → `/onboarding`. */
export default function RegisterPage() {
  redirect('/onboarding');
}
