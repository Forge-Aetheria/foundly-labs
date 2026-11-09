import { Navigate } from 'react-router-dom';
import { useSearchParams } from '@/shared/compat/useAppRouter';

/** Alias for the registration entry point: `/register` → `/onboarding`. */
export default function RegisterPage() {
  const params = useSearchParams();
  const email = params.get('email');
  const to = email ? `/onboarding?email=${encodeURIComponent(email)}` : '/onboarding';
  return <Navigate to={to} replace />;
}
