import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onUnauthenticated } from '../api/notify-unauthenticated';
import { clearTenantCache } from '../api/query-client';
import { tenantFromMetadata, type SessionStatus } from './guards';
import { createBrowserSupabaseClient } from './supabase';

interface SessionContextValue {
  status: SessionStatus;
  session: Session | null;
  userId: string | null;
  tenantId: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function statusFor(session: Session | null): SessionStatus {
  if (!session) return 'anonymous';
  const metadata = (session.user.app_metadata ?? {}) as Record<string, unknown>;
  return tenantFromMetadata(metadata) ? 'authenticated' : 'missing-tenant';
}

/**
 * Session provider (feature 024): reads the persisted Supabase session on boot,
 * follows auth-state changes, and reacts to the global unauthenticated signal by
 * clearing the cache and dropping the session.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    setStatus(statusFor(next));
  }, []);

  const refresh = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      applySession(null);
      return;
    }
    const { data } = await supabase.auth.getSession();
    applySession(data.session);
  }, [applySession]);

  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase?.auth.signOut();
    clearTenantCache(queryClient);
    applySession(null);
  }, [applySession, queryClient]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      applySession(null);
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) applySession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) applySession(next);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [applySession]);

  useEffect(() => {
    return onUnauthenticated(() => {
      clearTenantCache(queryClient);
      applySession(null);
      void createBrowserSupabaseClient()?.auth.signOut();
    });
  }, [applySession, queryClient]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      session,
      userId: session?.user.id ?? null,
      tenantId: session
        ? tenantFromMetadata((session.user.app_metadata ?? {}) as Record<string, unknown>)
        : null,
      refresh,
      signOut,
    }),
    [refresh, session, signOut, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }
  return context;
}
