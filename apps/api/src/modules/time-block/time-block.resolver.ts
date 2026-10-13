import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { TimeBlockService } from './time-block.service';
import { AddTimeBlockInput, TimeBlockObject } from './time-block.types';

@Resolver(() => TimeBlockObject)
export class TimeBlockResolver {
  constructor(private readonly service: TimeBlockService) {}

  /** Public read: a business's time blocks by id or public slug (optional specialist filter). */
  @Query(() => [TimeBlockObject])
  timeBlocks(
    @Args('tenantId', { type: () => ID, nullable: true }) tenantId?: string | null,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string | null,
    @Args('specialistId', { type: () => ID, nullable: true }) specialistId?: string | null,
  ): Promise<TimeBlockObject[]> {
    return this.service.list(
      { tenantId: tenantId ?? null, tenantSlug: tenantSlug ?? null },
      specialistId ?? null,
    );
  }

  @Mutation(() => TimeBlockObject)
  @RequireAuth()
  addTimeBlock(
    @AuthUserDecorator() user: AuthUser,
    @Args('input', { type: () => AddTimeBlockInput }) input: AddTimeBlockInput,
  ): Promise<TimeBlockObject> {
    return this.service.add(user, input);
  }

  @Mutation(() => Boolean)
  @RequireAuth()
  removeTimeBlock(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.remove(user, id);
  }
}
