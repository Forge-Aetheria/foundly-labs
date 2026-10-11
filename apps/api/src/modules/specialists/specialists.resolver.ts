import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SpecialistsService } from './specialists.service';
import {
  CreateSpecialistInput,
  SpecialistObject,
  UpdateSpecialistInput,
} from './specialists.types';

@Resolver(() => SpecialistObject)
export class SpecialistsResolver {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Query(() => [SpecialistObject])
  specialists(
    @Args('tenantId', { type: () => String, nullable: true }) tenantId?: string,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string,
  ): Promise<SpecialistObject[]> {
    return this.specialistsService.findSpecialists({ tenantId, tenantSlug });
  }

  @Query(() => SpecialistObject, { nullable: true })
  specialist(@Args('id') id: string): Promise<SpecialistObject | null> {
    return this.specialistsService.findSpecialist(id);
  }

  @Query(() => [SpecialistObject])
  serviceSpecialists(@Args('serviceId') serviceId: string): Promise<SpecialistObject[]> {
    return this.specialistsService.serviceSpecialists(serviceId);
  }

  @Mutation(() => SpecialistObject)
  createSpecialist(@Args('input') input: CreateSpecialistInput): Promise<SpecialistObject> {
    return this.specialistsService.createSpecialist(input);
  }

  @Mutation(() => SpecialistObject)
  updateSpecialist(
    @Args('id') id: string,
    @Args('input') input: UpdateSpecialistInput,
  ): Promise<SpecialistObject> {
    return this.specialistsService.updateSpecialist(id, input);
  }

  @Mutation(() => Boolean)
  removeSpecialist(@Args('id') id: string): Promise<boolean> {
    return this.specialistsService.removeSpecialist(id);
  }

  @Mutation(() => SpecialistObject)
  assignServiceToSpecialist(
    @Args('specialistId') specialistId: string,
    @Args('serviceId') serviceId: string,
  ): Promise<SpecialistObject> {
    return this.specialistsService.assignServiceToSpecialist(specialistId, serviceId);
  }

  @Mutation(() => SpecialistObject)
  unassignServiceFromSpecialist(
    @Args('specialistId') specialistId: string,
    @Args('serviceId') serviceId: string,
  ): Promise<SpecialistObject> {
    return this.specialistsService.unassignServiceFromSpecialist(specialistId, serviceId);
  }
}
