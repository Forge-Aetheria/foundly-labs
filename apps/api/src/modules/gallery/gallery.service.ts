import { Inject, Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import {
  conflictError,
  notFoundError,
  validationError,
  type TenantScopeInput,
} from '../../shared/tenant-scope';
import type { AuthUser } from '../auth/jwt.types';
import { GALLERY_STORE, type GalleryRow, type GalleryStore } from './gallery.store';
import type { AddGalleryItemInput } from './gallery.types';

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const CATEGORIES = ['local', 'trabajos', 'equipo'] as const;

function scopeError(): GraphQLError {
  return new GraphQLError('Missing tenant scope', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

function assertPhotoUrl(url: string): void {
  const value = typeof url === 'string' ? url.trim() : '';
  if (!value) {
    throw validationError('Photo URL is required');
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw validationError('Photo URL must be a valid absolute URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw validationError('Photo URL must use http or https');
  }
}

function normalizeCategory(category: string | null | undefined): string | null {
  if (category == null) {
    return null;
  }
  const value = category.trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (!(CATEGORIES as readonly string[]).includes(value)) {
    throw validationError('Unknown gallery category');
  }
  return value;
}

/** Tenant-scoped gallery reads/writes (feature 012). */
@Injectable()
export class GalleryService {
  constructor(@Inject(GALLERY_STORE) private readonly store: GalleryStore) {}

  /** Public read: photos of a business by id or public slug (unknown slug → empty). */
  async list(scope: TenantScopeInput): Promise<GalleryRow[]> {
    const tenantId = await this.store.resolveTenantId(scope);
    if (!tenantId) {
      return [];
    }
    return this.store.listByTenant(tenantId);
  }

  async add(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    input: AddGalleryItemInput,
  ): Promise<GalleryRow> {
    const tenantId = this.requireTenant(user);
    assertPhotoUrl(input.url);
    if (input.title != null && input.title.length > MAX_TITLE_LENGTH) {
      throw validationError(`title must be at most ${MAX_TITLE_LENGTH} characters`);
    }
    if (input.description != null && input.description.length > MAX_DESCRIPTION_LENGTH) {
      throw validationError(`description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
    }
    const url = input.url.trim();
    const existing = await this.store.findByUrl(tenantId, url);
    if (existing) {
      throw conflictError('This photo URL already exists in the gallery');
    }
    const order = await this.store.nextOrder(tenantId);
    return this.store.create(
      tenantId,
      {
        url,
        title: input.title?.trim() ? input.title.trim() : null,
        description: input.description?.trim() ? input.description.trim() : null,
        category: normalizeCategory(input.category),
      },
      order,
    );
  }

  async remove(user: Pick<AuthUser, 'tenantId'> | undefined, id: string): Promise<boolean> {
    const tenantId = this.requireTenant(user);
    const removed = await this.store.removeById(id, tenantId);
    if (!removed) {
      throw notFoundError('Gallery photo not found');
    }
    return true;
  }

  /** Resolve the authoritative tenant scope from the authenticated identity (never client input). */
  private requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw scopeError();
    }
    return user.tenantId;
  }
}
