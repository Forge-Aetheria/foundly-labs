'use server';

import { apiRequest } from '../../shared/api/client';
import {
  SearchBusinessesDocument,
  type SearchBusinessesQuery,
} from '../../shared/api/generated';
import { ok, type ActionResult } from '../../shared/types/result';
import type { DirectoryBusiness, DirectoryHoursRange } from './utils/types';

/**
 * Public directory module — server data access (feature 019; constitution §5.VI).
 * Codegen documents/types only. The public read is credential-free.
 */

type ApiBusiness = SearchBusinessesQuery['searchBusinesses'][number];

function mapHours(rows: ApiBusiness['schedule']): DirectoryHoursRange[] {
  return rows.map((row) => ({
    weekday: row.weekday,
    startTime: row.startTime,
    endTime: row.endTime,
  }));
}

function mapBusiness(dto: ApiBusiness): DirectoryBusiness {
  return {
    tenantId: dto.tenantId,
    slug: dto.slug,
    name: dto.name,
    category: dto.category,
    description: dto.description ?? null,
    address: dto.address ?? null,
    logo: dto.logo ?? null,
    cover: dto.cover ?? null,
    hours: mapHours(dto.schedule),
  };
}

/** Public listing of eligible businesses, optionally filtered by a text term. */
export async function getDirectoryBusinesses(
  query: string,
): Promise<ActionResult<DirectoryBusiness[]>> {
  const term = query.trim();
  const result = await apiRequest(SearchBusinessesDocument, {
    query: term.length > 0 ? term : null,
    limit: null,
    offset: null,
  });
  if (!result.ok) {
    return result;
  }
  return ok(result.data.searchBusinesses.map(mapBusiness));
}
