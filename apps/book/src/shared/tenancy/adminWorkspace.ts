'use server';

import { resolveTenantSession } from '../auth/authServer';
import { LOGIN_ROUTE, REGISTRATION_ROUTE } from '../auth/authConstants';
import { getCurrentTenant } from './queries';

/** Minimal workspace data the admin client shell needs (session-scoped). */
export interface AdminWorkspaceData {
  tenantId: string;
  tenantName?: string;
  publicHref: string | null;
  isPublic: boolean;
}

export type AdminWorkspaceResult =
  | { ok: true; data: AdminWorkspaceData }
  | { ok: false; redirectTo: string };

/**
 * Resolve the authenticated owner's workspace for the client admin shell.
 * Runs as a Server Action so the shell can stay a Client Component while
 * middleware keeps `/admin/*` protected.
 */
export async function loadAdminWorkspace(): Promise<AdminWorkspaceResult> {
  const auth = await resolveTenantSession();
  if (!auth.ok) {
    return {
      ok: false,
      redirectTo: auth.error.code === 'FORBIDDEN' ? REGISTRATION_ROUTE : LOGIN_ROUTE,
    };
  }
  if (!auth.data.tenantId) {
    return { ok: false, redirectTo: REGISTRATION_ROUTE };
  }

  const tenant = await getCurrentTenant(auth.data);
  return {
    ok: true,
    data: {
      tenantId: auth.data.tenantId,
      tenantName: tenant.ok ? tenant.data.name : undefined,
      publicHref: tenant.ok && tenant.data.slug ? `/${tenant.data.slug}` : null,
      isPublic: tenant.ok ? tenant.data.isPublic : true,
    },
  };
}
