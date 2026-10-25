import type { Session } from '@supabase/supabase-js';

export interface WorkspaceIdentity {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  initials: string;
  tenantName: string | null;
  tenantLogoUrl: string | null;
}

function readString(source: Record<string, unknown> | undefined, key: string): string | null {
  const value = source?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function initialsFrom(value: string): string {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'AD';

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toLocaleUpperCase('es')
    .slice(0, 2);
}

export function deriveWorkspaceIdentity(session: Session | null): WorkspaceIdentity {
  const metadata = session?.user.user_metadata as Record<string, unknown> | undefined;
  const email = session?.user.email?.trim() || null;
  const metadataAvatar = metadata?.avatar_url ?? metadata?.picture;

  const displayName =
    readString(metadata, 'full_name') ??
    readString(metadata, 'name') ??
    readString(metadata, 'display_name') ??
    email?.split('@')[0] ??
    'Administrador';

  return {
    displayName,
    email,
    avatarUrl: typeof metadataAvatar === 'string' && metadataAvatar.trim().length > 0
      ? metadataAvatar.trim()
      : null,
    initials: initialsFrom(displayName),
    tenantName: null,
    tenantLogoUrl: null,
  };
}
