import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { liveAuthEnv } from './shared/auth/supabase/env';
import { toNextResponseCookieOptions } from './shared/auth/supabase/cookies';
import { evaluateRedirect } from './shared/auth/authGuard';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

/**
 * Supabase session refresh + route guard (feature 008/009, feature 010).
 * Refreshes the session cookies on every navigation and protects `/admin/*`
 * (unauthenticated → `/login`) and `/login` (authenticated → admin). Claims are
 * verified via `getClaims()` (Edge-safe JWKS). Without live env there is NO
 * session source (the local cookie seam was removed in feature 010), so every
 * request is unauthenticated — the server guards re-validate.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const env = liveAuthEnv();
  let authenticated: boolean;

  if (env) {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values: { name: string; value: string; options: CookieOptions }[]) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, toNextResponseCookieOptions(options)),
          );
        },
      },
    });

    // Single refresh point; the verified claims also decide the guard.
    // `getClaims()` returns `{ data: { claims, header, signature } }`.
    const { data } = await supabase.auth.getClaims();
    const claims = (data?.claims ?? null) as Record<string, unknown> | null;
    authenticated = Boolean(claims && typeof claims.sub === 'string' && claims.sub.length > 0);
  } else {
    // Provider-only auth: nothing can authenticate without Supabase configured.
    authenticated = false;
  }

  const redirectTo = evaluateRedirect(request.nextUrl.pathname, authenticated);
  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return response;
}

export async function middleware(request: NextRequest) {
  return updateSession(request);
}
