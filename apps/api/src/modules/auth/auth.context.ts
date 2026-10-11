export interface AuthTenant {
  id: string;
  status: string;
  plan: string | null;
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
  tenant: AuthTenant;
}

export interface SessionPayload {
  u: string;
  t: string;
  r: string;
  exp: number;
}

export interface CurrentUser {
  userId: string;
  role: string;
  tenant: AuthTenant;
}
