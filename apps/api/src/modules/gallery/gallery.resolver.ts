import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { GalleryService } from './gallery.service';
import { AddGalleryItemInput, GalleryItem } from './gallery.types';

@Resolver(() => GalleryItem)
export class GalleryResolver {
  constructor(private readonly service: GalleryService) {}

  /** Public read: a business's gallery by id or public slug. */
  @Query(() => [GalleryItem])
  gallery(
    @Args('tenantId', { type: () => ID, nullable: true }) tenantId?: string | null,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string | null,
  ): Promise<GalleryItem[]> {
    return this.service.list({ tenantId: tenantId ?? null, tenantSlug: tenantSlug ?? null });
  }

  @Mutation(() => GalleryItem)
  @RequireAuth()
  addGalleryItem(
    @AuthUserDecorator() user: AuthUser,
    @Args('input', { type: () => AddGalleryItemInput }) input: AddGalleryItemInput,
  ): Promise<GalleryItem> {
    return this.service.add(user, input);
  }

  @Mutation(() => Boolean)
  @RequireAuth()
  removeGalleryItem(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.remove(user, id);
  }
}
