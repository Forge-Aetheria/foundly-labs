import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onUnauthenticated } from '../api/notify-unauthenticated';
import { clearTenantCache } from '../api/query-client';
import type { SessionStatus } from './guards';
import { supabase } from './supabase';

interface SessionContextValue {
  status: SessionStatus;
  session: Session | null;
  tenantId: string | null;
  userId: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  registerBeforeSignOut: (task: () => Promise<void>) => () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function tenantFromSession(session: Session | null): string | null {
  const metadata = session?.user.app_metadata as Record<string, unknown> | undefined;
  const tenantId = metadata?.tenant_id;
  return typeof tenantId === 'string' && tenantId.length > 0 ? tenantId : null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const beforeSignOut = useRef(new Set<() => Promise<void>>());

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    if (!next) {
      setStatus('anonymous');
      return;
    }
    setStatus(tenantFromSession(next) ? 'authenticated' : 'missing-tenant');
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    applySession(data.session);
  }, [applySession]);

  const registerBeforeSignOut = useCallback((task: () => Promise<void>) => {
    beforeSignOut.current.add(task);
    return () => beforeSignOut.current.delete(task);
  }, []);

  const signOut = useCallback(async () => {
    await Promise.allSettled([...beforeSignOut.current].map((task) => task()));
    await supabase.auth.signOut();
    clearTenantCache(queryClient);
    applySession(null);
  }, [applySession, queryClient]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) applySession(data.session);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) applySession(next);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [applySession]);

  useEffect(() => {
    return onUnauthenticated(() => {
      clearTenantCache(queryClient);
      applySession(null);
    });
  }, [applySession, queryClient]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      session,
      tenantId: tenantFromSession(session),
      userId: session?.user.id ?? null,
      signOut,
      refresh,
      registerBeforeSignOut,
    }),
    [refresh, registerBeforeSignOut, session, signOut, status],
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
