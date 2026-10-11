import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServicesService } from './services.service';
import { CreateServiceInput, ServiceObject, UpdateServiceInput } from './services.types';

@Resolver(() => ServiceObject)
export class ServicesResolver {
  constructor(private readonly servicesService: ServicesService) {}

  @Query(() => [ServiceObject])
  services(
    @Args('tenantId', { type: () => String, nullable: true }) tenantId?: string,
    @Args('tenantSlug', { type: () => String, nullable: true }) tenantSlug?: string,
    @Args('category', { type: () => String, nullable: true }) category?: string,
    @Args('minDuration', { type: () => Int, nullable: true }) minDuration?: number,
    @Args('maxDuration', { type: () => Int, nullable: true }) maxDuration?: number,
  ): Promise<ServiceObject[]> {
    return this.servicesService.findServices({
      tenantId,
      tenantSlug,
      category,
      minDuration,
      maxDuration,
    });
  }

  @Query(() => ServiceObject, { nullable: true })
  service(@Args('id') id: string): Promise<ServiceObject | null> {
    return this.servicesService.findService(id);
  }

  @Mutation(() => ServiceObject)
  createService(@Args('input') input: CreateServiceInput): Promise<ServiceObject> {
    return this.servicesService.createService(input);
  }

  @Mutation(() => ServiceObject)
  updateService(
    @Args('id') id: string,
    @Args('input') input: UpdateServiceInput,
  ): Promise<ServiceObject> {
    return this.servicesService.updateService(id, input);
  }

  @Mutation(() => Boolean)
  removeService(@Args('id') id: string): Promise<boolean> {
    return this.servicesService.removeService(id);
  }
}
