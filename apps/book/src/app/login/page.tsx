import { redirect } from 'next/navigation';
import { LoginView } from '../../modules/auth/LoginView';
import { getEffectiveSession } from '../../shared/auth/authServer';
import { POST_LOGIN_ROUTE, SESSION_EXPIRED_REASON } from '../../shared/auth/authConstants';

/** Sign-in route (public `/book/login`). Signed-in users are sent to the panel. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const session = await getEffectiveSession();
  if (session) {
    redirect(POST_LOGIN_ROUTE);
  }
  const params = await searchParams;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  return <LoginView sessionExpired={reason === SESSION_EXPIRED_REASON} />;
}
