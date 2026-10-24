import { redirect } from 'next/navigation';

/** Alias for the registration entry point: `/register` → `/onboarding`. */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === 'string' ? params.email : undefined;
  redirect(email ? `/onboarding?email=${encodeURIComponent(email)}` : '/onboarding');
}
