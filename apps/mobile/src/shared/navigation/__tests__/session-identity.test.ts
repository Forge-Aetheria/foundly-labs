import type { Session } from '@supabase/supabase-js';
import { deriveWorkspaceIdentity, initialsFrom } from '../session-identity';

function sessionWith(user: Record<string, unknown>, email: string | null = 'ana@foundly.dev'): Session {
  return {
    user: {
      id: 'user-1',
      email,
      user_metadata: user,
    },
  } as Session;
}

describe('workspace identity', () => {
  it('prefers the metadata full name and avatar', () => {
    const identity = deriveWorkspaceIdentity(
      sessionWith({ full_name: 'Ana Pérez', avatar_url: 'https://cdn.example/ana.png' }),
    );

    expect(identity).toMatchObject({
      displayName: 'Ana Pérez',
      email: 'ana@foundly.dev',
      avatarUrl: 'https://cdn.example/ana.png',
      initials: 'AP',
      tenantName: null,
    });
  });

  it('falls back to the name field and then the email local-part', () => {
    expect(deriveWorkspaceIdentity(sessionWith({ name: 'Ana' })).displayName).toBe('Ana');
    expect(deriveWorkspaceIdentity(sessionWith({})).displayName).toBe('ana');
  });

  it('uses a generic name when there is no session', () => {
    const identity = deriveWorkspaceIdentity(null);
    expect(identity.displayName).toBe('Administrador');
    expect(identity.email).toBeNull();
    expect(identity.initials).toBe('A');
  });

  it('builds readable initials', () => {
    expect(initialsFrom('Ana Pérez')).toBe('AP');
    expect(initialsFrom('Ana')).toBe('A');
    expect(initialsFrom('  ')).toBe('AD');
  });
});
