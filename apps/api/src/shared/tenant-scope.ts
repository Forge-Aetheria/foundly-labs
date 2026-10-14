import type { Prisma } from '@foundly/database';
import { GraphQLError } from 'graphql';
import type { PrismaService } from './prisma/prisma.service';

export interface TenantScopeInput {
  tenantId?: string | null;
  tenantSlug?: string | null;
}

export function validationError(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'VALIDATION_ERROR' },
  });
}

export function notFoundError(message = 'Resource not found'): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'NOT_FOUND' },
  });
}

export function conflictError(message = 'Conflict'): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'CONFLICT' },
  });
}

/** Domain error raised when a subscription plan boundary (limit or Pro gate) is exceeded. */
export function planLimitError(message = 'Plan limit reached'): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'PLAN_LIMIT_REACHED' },
  });
}

export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  return 'code' in error && (error as { code?: unknown }).code === 'P2002';
}

/** Resolve the tenant id from a `tenantId`/`tenantSlug` scope.
 * Returns null when only a slug is given and that public slug is unknown
 * (read callers turn this into empty results; write callers into NOT_FOUND). */
export async function resolveTenantId(
  client: PrismaService['client'],
  scope: TenantScopeInput,
): Promise<string | null> {
  const { tenantId, tenantSlug } = scope;
  if (!tenantId && !tenantSlug) {
    throw validationError('Provide tenantId or tenantSlug');
  }
  if (tenantId) {
    return tenantId;
  }
  const slug = tenantSlug ?? '';
  const profile = await client.businessProfile.findUnique({
    where: { slug },
    select: { tenantId: true },
  });
  return profile?.tenantId ?? null;
}

export function parseJsonField(
  raw: string | null | undefined,
  field: string,
): Prisma.InputJsonValue | null {
  if (raw == null) {
    return null;
  }
  try {
    return JSON.parse(raw) as Prisma.InputJsonValue;
  } catch {
    throw validationError(`${field} must be valid JSON`);
  }
}
