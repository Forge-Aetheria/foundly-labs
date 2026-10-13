import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { liveAuthEnv } from '../../../shared/auth/supabase/env';
import { toNextResponseCookieOptions } from '../../../shared/auth/supabase/cookies';
import { LOGIN_ROUTE, SESSION_EXPIRED_REASON } from '../../../shared/auth/authConstants';

/**
 * Global session-expiry handler (feature 012).
 *
 * Reached when the API rejects the session token (`UNAUTHENTICATED`) or the
 * bearer is missing. It clears the Supabase session cookies and bounces to
 * `/login?reason=session-expired`. Clearing first is essential: the route guard
 * would otherwise treat the still-"authenticated" session as valid and send the
 * owner straight back to `/admin` (redirect loop).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const redirectUrl = new URL(LOGIN_ROUTE, request.url);
  redirectUrl.searchParams.set('reason', SESSION_EXPIRED_REASON);
  const response = NextResponse.redirect(redirectUrl);

  const env = liveAuthEnv();
  if (env) {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values: { name: string; value: string; options: CookieOptions }[]) => {
          for (const { name, value, options } of values) {
            response.cookies.set(name, value, toNextResponseCookieOptions(options));
          }
        },
      },
    });
    await supabase.auth.signOut();
  }

  return response;
}
