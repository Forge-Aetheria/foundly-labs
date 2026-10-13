import { redirect } from 'next/navigation';
import { LoginView } from '../../modules/auth/LoginView';
import { getEffectiveSession } from '../../shared/infra/authServer';
import { POST_LOGIN_ROUTE } from '../../shared/infra/authConstants';

/** Sign-in route (public `/book/login`). Signed-in users are sent to the panel. */
export default async function LoginPage() {
  const session = await getEffectiveSession();
  if (session) {
    redirect(POST_LOGIN_ROUTE);
  }
  return <LoginView />;
}
