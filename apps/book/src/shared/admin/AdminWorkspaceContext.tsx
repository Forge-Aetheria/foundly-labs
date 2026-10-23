'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AdminWorkspaceData } from '../tenancy/adminWorkspace';

const AdminWorkspaceContext = createContext<AdminWorkspaceData | null>(null);

export interface AdminWorkspaceProviderProps {
  value: AdminWorkspaceData | null;
  children: ReactNode;
}

/** Shares the session-scoped workspace (tenant id, name, public slug) with admin pages. */
export function AdminWorkspaceProvider({ value, children }: AdminWorkspaceProviderProps) {
  return <AdminWorkspaceContext.Provider value={value}>{children}</AdminWorkspaceContext.Provider>;
}

/** Current admin workspace, or `null` while the client shell is still resolving it. */
export function useAdminWorkspace(): AdminWorkspaceData | null {
  return useContext(AdminWorkspaceContext);
}
