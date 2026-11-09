import { useSearchParams } from '@/shared/compat/useAppRouter';
import { SESSION_EXPIRED_REASON } from '../../shared/auth/authConstants';
import { PageMeta } from '../../shared/components/PageMeta';
import { LoginView } from '../../modules/auth/LoginView';

/** Sign-in route (public). Signed-in users are kept away by `<RequireAnonymous>`. */
export default function LoginPage() {
  const params = useSearchParams();
  const sessionExpired = params.get('reason') === SESSION_EXPIRED_REASON;
  return (
    <>
      <PageMeta title="Iniciar sesión" description="Accede a tu panel de Foundly Book." />
      <LoginView sessionExpired={sessionExpired} />
    </>
  );
}
