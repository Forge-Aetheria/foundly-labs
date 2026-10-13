import type { CookieOptions } from '@supabase/ssr';

/** Options accepted by Next's `ResponseCookies.set(name, value, options)`. */
export interface NextResponseCookieOptions {
  path?: string;
  maxAge?: number;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  expires?: Date;
}

/**
 * Convert @supabase/ssr `CookieOptions` (which allow `sameSite?: boolean`) into
 * the strict union Next expects — no `as` casts (constitution §5.IV).
 */
export function toNextResponseCookieOptions(options: CookieOptions): NextResponseCookieOptions {
  const sameSite =
    options.sameSite === true ? 'lax' : options.sameSite === false ? 'none' : options.sameSite;
  return {
    ...(options.path !== undefined ? { path: options.path } : {}),
    ...(options.maxAge !== undefined ? { maxAge: options.maxAge } : {}),
    ...(options.domain !== undefined ? { domain: options.domain } : {}),
    ...(options.secure !== undefined ? { secure: options.secure } : {}),
    ...(options.httpOnly !== undefined ? { httpOnly: options.httpOnly } : {}),
    ...(options.expires !== undefined ? { expires: options.expires } : {}),
    ...(sameSite !== undefined ? { sameSite } : {}),
  };
}