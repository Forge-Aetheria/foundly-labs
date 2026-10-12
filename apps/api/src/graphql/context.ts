import { prisma } from '@foundly/database';
import type { PrismaClient } from '@foundly/database';
import type { AuthUser } from '../modules/auth/jwt.types';

/** Per-request GraphQL context. Exposes the shared data seam (single persistence path). */
export interface GraphQLContext {
  prisma: PrismaClient;
  /** Verified caller identity; set by `SupabaseJwtGuard` on protected operations. */
  user?: AuthUser;
}

/** Context factory for `GraphQLModule.forRoot` — reuses the `@foundly/database` singleton. */
export function createContext(): GraphQLContext {
  return { prisma };
}