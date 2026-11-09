import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/query-client';
import type { Session } from '../auth/auth';
import { useSession } from '../auth/session-context';
import { getAuthIdentity } from '../auth/supabase';
import { fail, ok, type ActionResult } from '../types/result';
import { getCurrentTenant } from './queries';

/** Minimal workspace data the admin client shell needs (session-scoped). */
export interface AdminWorkspaceData {
  tenantId: string;
  tenantName?: string;
  tenantSlug?: string;
  publicHref: string | null;
  isPublic: boolean;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
}

/**
 * Resolve the authenticated owner's workspace (tenant + identity). Client-side
 * replacement for the previous Server Action (feature 024).
 */
export async function fetchAdminWorkspace(
  session: Session,
): Promise<ActionResult<AdminWorkspaceData>> {
  if (!session.tenantId) {
    return fail('FORBIDDEN', 'La sesión no está asociada a un negocio.');
  }
  const [tenant, identity] = await Promise.all([getCurrentTenant(session), getAuthIdentity()]);
  if (!tenant.ok) return tenant;
  return ok({
    tenantId: session.tenantId,
    tenantName: tenant.data.name,
    tenantSlug: tenant.data.slug || undefined,
    publicHref: tenant.data.slug ? `/${tenant.data.slug}` : null,
    isPublic: tenant.data.isPublic,
    userName: identity?.fullName ?? 'Administrador',
    userEmail: identity?.email ?? '',
    userAvatar: tenant.data.avatar ?? identity?.avatarUrl ?? null,
  });
}

/** Query hook for the admin shell (enabled only for a tenant-bound session). */
export function useAdminWorkspaceData() {
  const { status, session, tenantId } = useSession();
  const localSession: Session | null = session
    ? {
        userId: session.user.id,
        role: tenantId ? 'admin' : 'professional',
        ...(tenantId ? { tenantId } : {}),
      }
    : null;

  return useQuery({
    queryKey: queryKeys.workspace(tenantId),
    enabled: status === 'authenticated' && Boolean(tenantId) && Boolean(localSession),
    queryFn: async () => {
      if (!localSession) throw new Error('No hay sesión activa.');
      const result = await fetchAdminWorkspace(localSession);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });
}
