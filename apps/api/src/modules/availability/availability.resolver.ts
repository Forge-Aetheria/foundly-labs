import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AvailabilityService } from './availability.service';
import {
  AvailabilityObject,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from './availability.types';

@Resolver(() => AvailabilityObject)
export class AvailabilityResolver {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Query(() => [AvailabilityObject])
  availability(
    @Args('tenantId', { type: () => String, nullable: true }) tenantId?: string,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string,
    @Args('specialistId', { type: () => String, nullable: true }) specialistId?: string,
  ): Promise<AvailabilityObject[]> {
    return this.availabilityService.findAvailability({ tenantId, tenantSlug }, specialistId);
  }

  @Mutation(() => AvailabilityObject)
  createAvailability(@Args('input') input: CreateAvailabilityInput): Promise<AvailabilityObject> {
    return this.availabilityService.createAvailability(input);
  }

  @Mutation(() => AvailabilityObject)
  updateAvailability(
    @Args('id') id: string,
    @Args('input') input: UpdateAvailabilityInput,
  ): Promise<AvailabilityObject> {
    return this.availabilityService.updateAvailability(id, input);
  }

  @Mutation(() => Boolean)
  removeAvailability(@Args('id') id: string): Promise<boolean> {
    return this.availabilityService.removeAvailability(id);
  }
}
