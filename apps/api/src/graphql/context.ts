import { prisma } from '@foundly/database';
import type { PrismaClient } from '@foundly/database';

/** Per-request GraphQL context. Exposes the shared data seam (single persistence path). */
export interface GraphQLContext {
  prisma: PrismaClient;
}

/** Context factory for `GraphQLModule.forRoot` — reuses the `@foundly/database` singleton. */
export function createContext(): GraphQLContext {
  return { prisma };
}