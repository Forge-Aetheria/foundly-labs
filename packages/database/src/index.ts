import { PrismaClient } from '@prisma/client';

export { Prisma } from '@prisma/client';
export type * from '@prisma/client';
export { TenantCategory } from '@prisma/client';

/** Shared Prisma client instance for the workspace (single DB seam). */
export const prisma = new PrismaClient();
