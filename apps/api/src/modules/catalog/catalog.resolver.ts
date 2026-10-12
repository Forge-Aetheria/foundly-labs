import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { CatalogService } from './catalog.service';
import {
  CreateMyServiceInput,
  CreateMySpecialistInput,
  MyService,
  MySpecialist,
  UpdateMyServiceInput,
  UpdateMySpecialistInput,
} from './catalog.types';

@Resolver()
export class CatalogResolver {
  constructor(private readonly service: CatalogService) {}

  @Query(() => [MyService])
  @RequireAuth()
  async myServices(
    @AuthUserDecorator() user: AuthUser,
    @Args('active', { type: () => Boolean, nullable: true }) active?: boolean | null,
  ): ReturnType<CatalogService['listServices']> {
    return this.service.listServices(this.service.requireTenant(user), active ?? undefined);
  }

  @Query(() => MyService, { nullable: true })
  @RequireAuth()
  async myService(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): ReturnType<CatalogService['getService']> {
    return this.service.getService(id, this.service.requireTenant(user));
  }

  @Mutation(() => MyService)
  @RequireAuth()
  async createMyService(
    @AuthUserDecorator() user: AuthUser,
    @Args('input', { type: () => CreateMyServiceInput }) input: CreateMyServiceInput,
  ): ReturnType<CatalogService['createService']> {
    return this.service.createService(this.service.requireTenant(user), input);
  }

  @Mutation(() => MyService)
  @RequireAuth()
  async updateMyService(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdateMyServiceInput }) input: UpdateMyServiceInput,
  ): ReturnType<CatalogService['updateService']> {
    return this.service.updateService(id, this.service.requireTenant(user), input);
  }

  @Mutation(() => Boolean)
  @RequireAuth()
  async deleteMyService(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.deleteService(id, this.service.requireTenant(user));
  }

  @Query(() => [MySpecialist])
  @RequireAuth()
  async mySpecialists(
    @AuthUserDecorator() user: AuthUser,
    @Args('active', { type: () => Boolean, nullable: true }) active?: boolean | null,
  ): ReturnType<CatalogService['listSpecialists']> {
    return this.service.listSpecialists(this.service.requireTenant(user), active ?? undefined);
  }

  @Query(() => MySpecialist, { nullable: true })
  @RequireAuth()
  async mySpecialist(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): ReturnType<CatalogService['getSpecialist']> {
    return this.service.getSpecialist(id, this.service.requireTenant(user));
  }

  @Mutation(() => MySpecialist)
  @RequireAuth()
  async createMySpecialist(
    @AuthUserDecorator() user: AuthUser,
    @Args('input', { type: () => CreateMySpecialistInput }) input: CreateMySpecialistInput,
  ): ReturnType<CatalogService['createSpecialist']> {
    return this.service.createSpecialist(this.service.requireTenant(user), input);
  }

  @Mutation(() => MySpecialist)
  @RequireAuth()
  async updateMySpecialist(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdateMySpecialistInput }) input: UpdateMySpecialistInput,
  ): ReturnType<CatalogService['updateSpecialist']> {
    return this.service.updateSpecialist(id, this.service.requireTenant(user), input);
  }

  @Mutation(() => Boolean)
  @RequireAuth()
  async deleteMySpecialist(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.deleteSpecialist(id, this.service.requireTenant(user));
  }
}