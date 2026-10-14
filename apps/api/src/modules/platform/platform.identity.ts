import { Injectable } from '@nestjs/common';

/** User counts resolved from the platform identity provider. */
export interface UserStats {
  total: number;
  active: number;
}

export const PLATFORM_IDENTITY = Symbol('PLATFORM_IDENTITY');

/**
 * Seam over the identity provider (users are owned by the provider, not the database).
 * Returns `null` when the provider is unconfigured or unreachable, so callers can degrade.
 */
export interface PlatformIdentityClient {
  getUserStats(): Promise<UserStats | null>;
}

interface ProviderUser {
  confirmed_at?: string | null;
  email_confirmed_at?: string | null;
  banned_until?: string | null;
  deleted_at?: string | null;
}

const PER_PAGE = 1000;
const MAX_PAGES = 100;

/**
 * Supabase Admin API client. Reads the service-role credential from the environment
 * (server-only) and pages through `/admin/users` with a bounded cap. Any missing
 * credentials, non-OK response or transport error yields `null` (graceful degradation).
 */
@Injectable()
export class SupabaseAdminIdentityClient implements PlatformIdentityClient {
  async getUserStats(): Promise<UserStats | null> {
    const url = process.env.SUPABASE_AUTH_URL?.replace(/\/+$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) {
      return null;
    }
    try {
      let total = 0;
      let active = 0;
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const response = await fetch(`${url}/admin/users?page=${page}&per_page=${PER_PAGE}`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
        if (!response.ok) {
          return null;
        }
        const body = (await response.json()) as { users?: ProviderUser[] };
        const users = body.users ?? [];
        total += users.length;
        active += users.filter(
          (user) =>
            !user.deleted_at &&
            !user.banned_until &&
            Boolean(user.email_confirmed_at ?? user.confirmed_at),
        ).length;
        if (users.length < PER_PAGE) {
          break;
        }
      }
      return { total, active };
    } catch {
      return null;
    }
  }
}

/** In-memory identity client for DB/network-free specs. */
export function createMemoryIdentityClient(stats: UserStats | null = null): PlatformIdentityClient {
  return {
    async getUserStats() {
      return stats;
    },
  };
}
